import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  eventId: text('event_id').primaryKey(),
  handledAt: timestamp('handled_at', { mode: 'date' }).notNull(),
});
