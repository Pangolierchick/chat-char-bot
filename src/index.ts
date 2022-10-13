import {Bot, session} from 'grammy';
import {Menu} from '@grammyjs/menu';
import * as dotenv from 'dotenv';
import {addMeditation, buySubscription, giveSubscribtion} from './cmds';
import {ChatChar} from './facade';


import {
  conversations,
  createConversation,
} from '@grammyjs/conversations';
import {MyContext, SessionData} from './types';

dotenv.config();

if (typeof process.env.WALLET_ID === 'undefined') {
  throw new Error('Add wallet id in .env file');
}

if (typeof process.env.TELEGRAM_TOKEN === 'undefined') {
  throw new Error('Add telegram token in .env file');
}

if (typeof process.env.CHAT_URL === 'undefined') {
  throw new Error('Add chat url in .env file');
}

const WALLET_ID = process.env.WALLET_ID;
const CHAT_URL = process.env.CHAT_URL;

const bot = new Bot<MyContext>(process.env.TELEGRAM_TOKEN);
const chatChar = new ChatChar(WALLET_ID);
chatChar.sendMeditations(bot.api).catch((r) => {
  console.error(r);
});

export const buySubscribtionCallBack = async (chatId: number, userWalletId: string, duration: number, ctx: MyContext) => {
  await chatChar.buySubscribtion(chatId, userWalletId, duration, ctx);
};

export const giveSubscribtionCallBack = async (chatId: number, duration: number, ctx: MyContext) => {
  await chatChar.addSubscribtion(chatId, duration, ctx);
};

const defMainMenu = new Menu<MyContext>('default-user-menu')
  .submenu('Купить подписку', 'subscription-menu').row()
  .text('Проверить подписку', async (ctx) => {
    const subscription = await chatChar.getSubscription(ctx.msg!.chat.id);
    if (subscription === null) {
      await ctx.reply('Вы не подписаны.');
    } else if (new Date(subscription.end) < new Date()) {
      await ctx.reply('Ваша подписка истекла.');
    } else {
      await ctx.reply(`Подписка действительна до ${new Date(subscription.end).toLocaleDateString('ru')}`);
    }
  }).row()
  .url('Чат', CHAT_URL).row()
  .submenu('Помощь', 'help-menu');

const adminMainMenu = new Menu<MyContext>('admin-menu')
  .text('Добавить медитацию', async (ctx) => await ctx.conversation.enter('addMeditation')).row()
  .submenu('Дать подписку пользователю', 'give-sub-submenu').row()
  .submenu('Обычное меню', 'default-user-menu');

const giveUserSubMenu = new Menu<MyContext>('give-sub-submenu')
  .text('Месяц', async (ctx) => { ctx.session.duration = 1; await ctx.conversation.enter('giveSubscribtion');})
  .text('3 месяца', async (ctx) => { ctx.session.duration = 3; await ctx.conversation.enter('giveSubscribtion');})
  .text('6 месяцев', async (ctx) => { ctx.session.duration = 6; await ctx.conversation.enter('giveSubscribtion');}).row()
  .back('Назад');

const helpMenu = new Menu<MyContext>('help-menu')
  .text('Помощь', (ctx) => ctx.reply(`Если вам необходима помощь, напишите @letchiks. В случае ошибки с платежом, отправьте также Ваш Id ${ctx.msg?.chat.id}`))
  .text('Ошибка', (ctx) => ctx.reply('to do'))
  .text('Разработчик', (ctx) => ctx.reply('@pangolierchick')).row()
  .back('Назад');

const checkSubscription = async (ctx: MyContext) => {
  const subscription = await chatChar.getSubscription(ctx.msg!.chat.id);
  if (!!subscription && new Date(subscription.end) >= new Date()) {
    await ctx.reply(`Ваша подписка действительна до ${new Date(subscription.end).toLocaleDateString('ru')}`);
    return true;
  }

  return false;
};

const subscribtionMenu = new Menu<MyContext>('subscription-menu')
  .text('Месяц', async (ctx) => {
    if (await checkSubscription(ctx)) {
      return;
    }

    ctx.session.duration = 1;
    await ctx.conversation.enter('buySubscription');
  }).row()
  .text('3 месяца', async (ctx) => {
    if (await checkSubscription(ctx)) {
      return;
    }
    ctx.session.duration = 3;
    await ctx.conversation.enter('buySubscription');
  }).row()
  .text('6 месяцев', async (ctx) => {
    if (await checkSubscription(ctx)) {
      return;
    }
    ctx.session.duration = 6;
    await ctx.conversation.enter('buySubscription');
  }).row()
  .back('Назад');


function initial(): SessionData {
  return {
    duration: 0,
    walletId: WALLET_ID,
  };
}

bot.use(session({initial}));
bot.use(conversations());

bot.use(conversations());
bot.use(createConversation(addMeditation));
bot.use(createConversation(buySubscription));
bot.use(createConversation(giveSubscribtion));

adminMainMenu.register(giveUserSubMenu);
defMainMenu.register(subscribtionMenu);
defMainMenu.register(helpMenu);
bot.use(defMainMenu);

adminMainMenu.register(defMainMenu);
bot.use(adminMainMenu);

bot.on(':text', async (ctx) => {
  let menu = defMainMenu;
  const isAdmin = await chatChar.getDb().isAdmin(ctx.msg.chat.id.toString());
  await chatChar.registerUser(ctx.chat.id);

  if (isAdmin) {
    menu = adminMainMenu;
  }
  await ctx.reply('Меню', {reply_markup: menu});
});

async function main() {
}

main();

bot.catch((reason) => {
  console.log(reason);
});

bot.start();
