import {SubscriptionPrice, MONTH, THREE_MONTH, SIX_MONTH} from './types';

export function validatePhoneNumber(phoneNumber: string) {
  const regex = /^\+7\d{3}\d{3}\d{2}\d{2}/;
  return regex.test(phoneNumber.trim());
}

export function durationToPrice(duration: number) {
  const map = new Map<number, SubscriptionPrice>([
    [MONTH, SubscriptionPrice.month],
    [THREE_MONTH, SubscriptionPrice.threeMonth],
    [SIX_MONTH, SubscriptionPrice.sixMonth],
  ]);

  const price = map.get(duration);
  if (price) {
    return price;
  }

  throw new Error('Incorrect duration given');
}

export function priceToDuration(price: SubscriptionPrice) {
  const map = new Map<SubscriptionPrice, number>([
    [SubscriptionPrice.month, MONTH],
    [SubscriptionPrice.threeMonth, THREE_MONTH],
    [SubscriptionPrice.sixMonth, SIX_MONTH],
  ]);

  const duration = map.get(price);
  if (duration) {
    return duration;
  }

  throw new Error('Incorrect price given');
}
