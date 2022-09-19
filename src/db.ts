import sqlite3 from 'sqlite3';
import {RawSubscriber, RawTransaction} from './types';
import {ICharDB, RawUser} from './types';

export class CharDB implements ICharDB {
  private dbase: sqlite3.Database | undefined;

  connect(name: string) {
    if (typeof this.dbase === 'undefined') {
      this.dbase = new sqlite3.Database(name);
    }

    return this;
  }

  async insertUser(user: RawUser): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('insert into Users values(?, ?, ?)')
        .run([user.chatId, user.name, user.id])
        .finalize();

      resolve();
    });
  }

  async updateUser(user: RawUser): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('update Users set name=(?), chatId=(?) where id=(?)')
        .run([user.name, user.chatId, user.id])
        .finalize();

      resolve();
    });
  }

  async getUserByChatId(chatId: number): Promise<RawUser | null> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('select * from Users where chatId=(?)')
        .get(chatId, (err, row) => {
          if (err) {
            reject(err.message);
          }

          if (typeof row === 'undefined') {
            resolve(null);
          }

          resolve(row);
        });
    });
  }

  async getUserById(id: string): Promise<RawUser | null> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('select * from Users where id=(?)')
        .get(id, (err, row) => {
          if (err) {
            reject(err.message);
          }

          if (typeof row === 'undefined') {
            resolve(null);
          }

          resolve(row);
        });
    });
  }

  async getSubscriber(id: string): Promise<RawSubscriber | null> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('select * from Subscribers where id=(?)')
        .get(id, (err, row) => {
          if (err) {
            reject(err.message);
          }

          if (typeof row === 'undefined') {
            resolve(null);
          }

          resolve(row as RawSubscriber);
        });
    });
  }

  async getTransaction(id: number): Promise<RawTransaction | null> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('select * from Transactions where id=(?)')
        .get(id, (err, row) => {
          if (err) {
            reject(err.message);
          }

          if (row) {
            resolve({
              id: row.id,
              sum: row.sum,
              userId: row.userId,
            });
          }

          resolve(null);
        });
    });
  }

  async removeSubscriber(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('delete from Subscribers where id=(?)')
        .run(id, (err) => {
          if (err) {
            reject(err.message);
          }

          resolve();
        });
    });
  }

  async insertSubscriber(subscriber: RawSubscriber): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      const args = [subscriber.id, subscriber.start, subscriber.end, subscriber.currentMeditationId];

      this.dbase!
        .prepare('insert into Subscribers values (?, ?, ?, ?)')
        .run([...args], function (err) {
          if (err) {
            reject(err.message);
          }

          resolve();
        })
        .finalize();
    });
  }

  async isAdmin(userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('select * from Admins where id=(?)')
        .get(userId, (err, row) => {
          if (err) {
            reject(err.message);
          }

          resolve(typeof row !== 'undefined');
        });
    });
  }

  async insertAdmin(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('insert into Admins values (?)')
        .run(userId)
        .finalize();

      resolve();
    });
  }

  async insertTransaction(id: number, userId: string, sum: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('insert into Transactions values (?, ?, ?)')
        .run(id, sum, userId)
        .finalize();

      resolve();
    });
  }

  async getSubscribers(): Promise<RawSubscriber[]> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      const subscribers: RawSubscriber[] = [];

      this.dbase!
        .each('select * from Subscribers', (err, row) => {
          if (err) {
            reject(err.message);
          }

          subscribers.push(row as RawSubscriber);
        }, (err, count) => {
          if (err) {
            reject(err.message);
          }

          resolve(subscribers);
        });
    });
  }

  async getSubscriberByChatId(chatId: number): Promise<RawSubscriber | null> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('select * from Subscribers s join Users u on s.id=u.id where u.chatId=(?)')
        .get(chatId, (err, row) => {
          if (err)
            reject(err);

          if (row) {
            resolve({
              id: row.id,
              start: row.start,
              end: row.end,
              currentMeditationId: row.currentMeditationId,
            } as RawSubscriber);
          }

          resolve(null);
        });
    });
  }

  async incrementMeditationId(chatId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare(`update Subscribers
        set currentMeditationId = currentMeditationId + 1
        where id = (select id from Users where chatId=(?));`)
        .run(chatId)
        .finalize();
      resolve();
    });
  }

  async updateSubscription(subscriber: RawSubscriber): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof this.dbase === 'undefined') {
        reject('connect to dbase firstly');
      }

      this.dbase!
        .prepare('update Subscribers set start=(?), end=(?), currentMeditationId=(?) where id=(?)')
        .run(subscriber.start, subscriber.end, subscriber.currentMeditationId, subscriber.id)
        .finalize();
      resolve();
    });
  }

  disconnect() {
    if (typeof this.dbase === 'undefined') {
      throw new Error('connect to dbase firstly');
    }

    this.dbase.close();
  }
}
