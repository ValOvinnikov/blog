import { MILLISECONDS_PER_SECOND } from '@platform/constants/billing';

export const fromStripeTime = (seconds: number): Date =>
  new Date(seconds * MILLISECONDS_PER_SECOND);

export const toStripeTime = (date: Date): number =>
  Math.floor(date.getTime() / MILLISECONDS_PER_SECOND);
