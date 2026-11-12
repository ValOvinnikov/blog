import type { TPaidSubscriberBandCeiling } from '@blog/db/constants';
import { integer, text, timestamp } from 'drizzle-orm/pg-core';

export const tenantBillingColumns = {
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePromotionCode: text('stripe_promotion_code'),
  subscriberBandCeiling: integer(
    'subscriber_band_ceiling',
  ).$type<TPaidSubscriberBandCeiling>(),
  trialEndsAt: timestamp('trial_ends_at', { mode: 'date' }),
  downgradeGraceStartedAt: timestamp('downgrade_grace_started_at', {
    mode: 'date',
  }),
  graceStartedEmailSentAt: timestamp('grace_started_email_sent_at', {
    mode: 'date',
  }),
  graceHalfwayEmailSentAt: timestamp('grace_halfway_email_sent_at', {
    mode: 'date',
  }),
  graceEndingEmailSentAt: timestamp('grace_ending_email_sent_at', {
    mode: 'date',
  }),
};
