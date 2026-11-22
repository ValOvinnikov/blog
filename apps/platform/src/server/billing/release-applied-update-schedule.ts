import 'server-only';

import { STRIPE_EVENT_TYPE } from '@platform/constants/stripe-event';
import type Stripe from 'stripe';

import { releaseSchedule } from './release-schedule';
import { stripeIdOf } from './stripe-id';

export const releaseAppliedUpdateSchedule = async (
  stripe: Stripe,
  event: Stripe.Event,
): Promise<void> => {
  if (event.type !== STRIPE_EVENT_TYPE.SUBSCRIPTION_UPDATED) return;
  const {
    object: { pending_update, schedule },
    previous_attributes,
  } = event.data;
  // An expired pending update clears `pending_update` without touching `items`.
  const isApplied =
    previous_attributes?.pending_update &&
    previous_attributes.items &&
    !pending_update;
  if (isApplied && schedule) {
    await releaseSchedule(stripe, stripeIdOf(schedule));
  }
};
