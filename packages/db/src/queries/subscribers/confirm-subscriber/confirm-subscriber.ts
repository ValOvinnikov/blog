import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { eq } from 'drizzle-orm';

export type TConfirmSubscriberResult =
  | { outcome: 'confirmed'; subscriber: TSubscriber }
  | { outcome: 'already-confirmed'; subscriber: TSubscriber }
  | { outcome: 'not-found' };

// Flips a subscriber from `pending` to `active` by their confirmation
// token — the confirm-email link's route handler (#1104,
// `/newsletter/confirm?token=...`).
//
// Idempotent-safe by design, not by accident: a second hit on the same
// link (double-click, browser link-prefetch, a user revisiting an old
// email) reports `already-confirmed` with the existing row instead of
// either erroring or re-stamping `confirmedAt` to a later time — per the
// issue's "confirming twice shouldn't error, though it also shouldn't need
// to succeed twice." An unrecognized/expired token returns `not-found`
// rather than throwing, since an invalid link is an expected, not
// exceptional, path here.
export async function confirmSubscriber(
  token: string,
): Promise<TConfirmSubscriberResult> {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.confirmationToken, token));

  if (!existing) {
    return { outcome: 'not-found' };
  }

  if (existing.status === 'active') {
    return { outcome: 'already-confirmed', subscriber: existing };
  }

  const [updated] = await db
    .update(subscribers)
    .set({ status: 'active', confirmedAt: new Date() })
    .where(eq(subscribers.id, existing.id))
    .returning();

  if (!updated) {
    // Unreachable in practice: `existing` was just read by primary key's
    // unique `confirmationToken`, so the update it drives by `id` has
    // exactly one row to match. Thrown rather than silently returning
    // `undefined` so a real regression here surfaces immediately instead
    // of as a confusing downstream crash.
    throw new Error(
      `confirmSubscriber: update for subscriber "${existing.id}" returned no row.`,
    );
  }

  return { outcome: 'confirmed', subscriber: updated };
}
