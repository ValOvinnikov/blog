import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { and, eq } from 'drizzle-orm';

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
//
// The transition is a single conditional `UPDATE ... WHERE
// confirmation_token = $token AND status = 'pending'`, not a read-then-write
// (read the row, branch on its `status`, then update it): two concurrent
// hits on the same link could otherwise both read `status: 'pending'`
// before either write lands, and both would then run the update — one
// clobbering the other's `confirmedAt` (last-write-wins), with both callers
// seeing `confirmed` instead of one `confirmed`/one `already-confirmed`.
// Gating the `UPDATE` itself on `status = 'pending'` means only the call
// that actually performs the transition gets a row back from `RETURNING` —
// Postgres serializes concurrent updates to the same row, so exactly one of
// two racing calls can win this `WHERE`, never both.
export async function confirmSubscriber(
  token: string,
): Promise<TConfirmSubscriberResult> {
  const db = getDb();

  const [updated] = await db
    .update(subscribers)
    .set({ status: 'active', confirmedAt: new Date() })
    .where(
      and(
        eq(subscribers.confirmationToken, token),
        eq(subscribers.status, 'pending'),
      ),
    )
    .returning();

  if (updated) {
    return { outcome: 'confirmed', subscriber: updated };
  }

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.confirmationToken, token));

  if (!existing) {
    return { outcome: 'not-found' };
  }

  return { outcome: 'already-confirmed', subscriber: existing };
}
