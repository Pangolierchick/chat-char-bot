import fetch from 'node-fetch';
import {URLSearchParams} from 'url';
import {Transaction, TransactionStatus} from './types';

export class Qiwi {
  private walletId: string;

  constructor(walletId: string) {
    this.walletId = walletId;
  }

  async getLastFromToday(amount = 30) {
    const current = new Date();
    const today = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0);
    const tomorow = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);

    const params = new URLSearchParams({
      'operation': 'IN',
      'rows': amount.toString(),
      'startDate': today.toISOString(),
      'endDate': tomorow.toISOString(),
    });
    const resp = await fetch(`https://edge.qiwi.com/payment-history/v2/persons/${this.walletId}/payments?` + params, {
      method: 'get',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.QIWI_TOKEN}`,
      },
    });

    if (resp.status !== 200) {
      throw new Error('Transaction get failed');
    }

    const transactions: Transaction[] = [];

    const data = (await resp.json() as any);
    for (const row of data.data) {
      transactions.push({
        transactionId: Number(row.txnId),
        sum: row.sum.amount,
        walletId: row.account,
        status: TransactionStatus.done,
      });
    }

    return transactions;
  }

  async getLast(amount = 30) {
    const params = new URLSearchParams({
      'operation': 'IN',
      'rows': amount.toString(),
    });
    const resp = await fetch(`https://edge.qiwi.com/payment-history/v2/persons/${this.walletId}/payments?` + params, {
      method: 'get',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.QIWI_TOKEN}`,
      },
    });

    if (resp.status !== 200) {
      throw new Error('Transaction get failed');
    }

    const transactions: Transaction[] = [];

    const data = (await resp.json() as any);
    for (const row of data.data) {
      transactions.push({
        transactionId: Number(row.txnId),
        sum: row.sum.amount,
        walletId: row.account,
        status: TransactionStatus.done,
      });
    }

    return transactions;
  }

  async getTransaction(id: number) {
    const resp = await fetch(`https://edge.qiwi.com/payment-history/v2/transactions/${id}?`, {
      method: 'get',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.QIWI_TOKEN}`,
      },
    });

    if (resp.status !== 200) {
      throw new Error('Transaction get failed');
    }

    const data = (await resp.json() as any);

    const transaction: Transaction = {
      transactionId: Number(data.txnId),
      sum: data.sum.amount,
      walletId: data.account,
      status: TransactionStatus.done,
    };

    return transaction;
  }
}
