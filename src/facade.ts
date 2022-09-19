import {CharDB} from './db';
import {Qiwi} from './qiwi';
import {MyContext, PendingTransaction, QIWI_INTERVAL_MS, Transaction, TransactionStatus} from './types';
import {v4 as uuid} from 'uuid';
import {Subscriber} from './subscriber';
import {durationToPrice, priceToDuration} from './util';
import {setIntervalAsync} from 'set-interval-async';
import {SetIntervalAsyncTimer} from 'set-interval-async';
import {Api, RawApi} from 'grammy';
import {loadMeditations} from './meditationSaver';
import {schedule} from 'node-cron';

const DB_FILENAME = 'chardb';

export class ChatChar {
  private qiwi: Qiwi;
  private db: CharDB;
  private pendingTransactions: PendingTransaction[];
  private qiwiTimer: SetIntervalAsyncTimer<[]> | undefined;

  getDb() {
    return this.db;
  }

  constructor(walletId: string) {
    this.qiwi = new Qiwi(walletId);
    this.db = new CharDB().connect(DB_FILENAME);
    this.pendingTransactions = [];
  }

  async registerQiwiInterval() {
    if (this.qiwiTimer)
      return;

    this.qiwiTimer = setIntervalAsync(async () => {
      const qiwiTransactions = await this.qiwi.getLastFromToday();
      for (const pendingTransaction of this.pendingTransactions) {
        qiwiTransactions.forEach(async element => {
          const alreadyDone = await this.transactionAlreadyDone(element);

          if (!alreadyDone && element.walletId === pendingTransaction.walletId && element.sum === pendingTransaction.sum) {
            await this.addSubscribtion(pendingTransaction.ctx.msg!.chat.id, priceToDuration(pendingTransaction.sum), pendingTransaction.ctx);
            await this.saveTransaction(element, pendingTransaction.ctx.msg!.chat.id);
          }
        });
      }
    }, QIWI_INTERVAL_MS);
  }

  async transactionAlreadyDone(transaction: Transaction) {
    if (transaction.status === TransactionStatus.done) {
      return await this.db.getTransaction(transaction.transactionId!) !== null;
    }
    return false;
  }

  async getSubscription(chatId: number) {
    return await this.db.getSubscriberByChatId(chatId);
  }

  async saveTransaction(transaction: Transaction, chatId: number) {
    const user = await this.db.getUserByChatId(chatId);
    if (user && transaction.transactionId) {
      await this.db.insertTransaction(transaction.transactionId, user.id, transaction.sum);
    }
  }

  async registerUser(chatId: number) {
    const user = await this.db.getUserByChatId(chatId);
    if (!user) {
      const rawUser = {
        chatId: chatId,
        id: uuid(),
      };

      await this.db.insertUser(rawUser);
    }
  }

  async sendMeditations(api: Api<RawApi>) {
    schedule('00 21 * * *', async () => {
      const subscribers = await this.db.getSubscribers();
      const meditations = await loadMeditations();
      for (const subscriber of subscribers) {
        const user = await this.db.getUserById(subscriber.id);
        const chatId = user!.chatId.toString();
        if (new Date(subscriber.end) > new Date()) {
          const needMeditation = meditations[subscriber.currentMeditationId];
          api.sendMessage(chatId, needMeditation.caption).then(() => {
            return api.sendVoice(chatId, needMeditation.voiceId);
          }).then(() => {
            return api.sendPhoto(chatId, needMeditation.pictureId);
          });

          await this.db.incrementMeditationId(user!.chatId);
        } else {
          await api.sendMessage(chatId, 'Ваша подписка закончилась. Чтобы получать следующие медитации, продлите подписку.');
        }
      }
    });
  }

  async buySubscribtion(chatId: number, userWalletId: string, duration: number, ctx: MyContext) {
    const price = durationToPrice(duration);
    const transaction: PendingTransaction = {
      status: TransactionStatus.pending,
      sum: price,
      walletId: userWalletId,
      chatId: chatId,
      ctx: ctx,
    };

    this.pendingTransactions.push(transaction);
    await this.registerQiwiInterval();
  }

  async addSubscribtion(chatId: number, duration: number, ctx?: MyContext) {
    await this.registerUser(chatId);
    try {
      const user = await this.db.getUserByChatId(chatId);
      if (user) {
        const prevSub = await this.db.getSubscriber(user.id);
        let sub: Subscriber;
        if (prevSub) {
          sub = Subscriber.fromToday(user.id, duration, prevSub.currentMeditationId);
          await this.db.updateSubscription(sub.raw());
        } else {
          sub = Subscriber.fromToday(user.id, duration);
          await this.db.insertSubscriber(sub.raw());
        }

        if (ctx) {
          await ctx.api.sendMessage(chatId, `Подписка была оформлена до ${sub.end.toLocaleDateString('ru')}`);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
}
