import { text, timestamp } from 'drizzle-orm/pg-core';

export const tenantBillingColumns = {
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePromotionCode: text('stripe_promotion_code'),
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
