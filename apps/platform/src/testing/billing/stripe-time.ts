import { MILLISECONDS_PER_SECOND } from '@platform/constants/billing';

export const toStripeTime = (date: Date): number =>
  Math.floor(date.getTime() / MILLISECONDS_PER_SECOND);
