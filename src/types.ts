import {ConversationFlavor, Conversation} from '@grammyjs/conversations';
import {Context, SessionFlavor} from 'grammy';

//FIXME
export const MONTH_SUBSCRIPTION_PRICE = 1;
export const QIWI_INTERVAL_MS = 3000;

export interface ICharDB {
  connect(name: string): this;
  disconnect(): void;
  getSubscribers(): Promise<RawSubscriber[]>;
  getSubscriber(id: string): Promise<RawSubscriber | null>;
  updateSubscription(subscriber: RawSubscriber): Promise<void>;
  insertSubscriber(subscriber: RawSubscriber): Promise<void>;
  removeSubscriber(id: string): Promise<void>;
  insertUser(user: RawUser): Promise<void>;
  getUserByChatId(chatId: number): Promise<RawUser | null>;
  updateUser(user: RawUser): Promise<void>;
  insertAdmin(userId: string): Promise<void>;
  isAdmin(userId: string): Promise<boolean>;
  insertTransaction(id: number, userId: string, sum: number): Promise<void>;
  getTransaction(id: number): Promise<RawTransaction | null>;
}

export enum SubscriptionPrice {
  none = 0,
  month = MONTH_SUBSCRIPTION_PRICE,
  threeMonth = month * 3,
  year = month * 12,
}

export enum Duration {
  none = 0,
  month,
  threeMonth = 3,
  year = 12,
}

export const MONTH = 1;
export const THREE_MONTH = MONTH * 3;
export const YEAR = MONTH * 12;

export type RawSubscriber = {
  id: string;
  start: number;
  end: number;
  currentMeditationId: number
};

export type RawUser = {
  id: string;
  chatId: number;
  name?: string;
}

export type RawTransaction = {
  id: number;
  sum: number;
  userId: string;
}

export enum TransactionStatus {
  pending = 'Pending',
  rejected = 'Rejected',
  done = 'Done',
}

export type Transaction = {
  status: TransactionStatus;
  sum: number;
  walletId: string;
  transactionId?: number;
}

export type PendingTransaction = Transaction & {
  ctx: MyContext;
  chatId: number;
}

export type Meditation = {
  voiceId: string;
  caption: string;
  pictureId: string;
};

export interface SessionData {
  meditationToAdd?: Meditation;
  duration: number;
  walletId: string;
}

export type MyContext = Context & ConversationFlavor & SessionFlavor<SessionData>;
export type MyConversation = Conversation<MyContext>;
