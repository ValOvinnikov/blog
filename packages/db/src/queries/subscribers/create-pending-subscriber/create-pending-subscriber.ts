import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { eq } from 'drizzle-orm';

// The three shapes `NewsletterForm`'s server action (#1104) needs to
// distinguish: a brand-new signup, a re-submission while a confirmation
// email is still unconfirmed, and the design doc's "already subscribed"
// inline error state (Feature 5's Error states) for an email that's already
// `active`. All three carry the row itself so the caller (e.g. to re-send
// the confirmation email via Resend using the existing token) doesn't need
// a second read.
export type TCreatePendingSubscriberResult =
  | { outcome: 'created'; subscriber: TSubscriber }
  | { outcome: 'already-pending'; subscriber: TSubscriber }
  | { outcome: 'already-active'; subscriber: TSubscriber };

// Creates a pending subscriber row for `email` — the newsletter signup
// form's submit action (Feature 5 / #1044, double opt-in per D9). `email`
// is normalized (trimmed, lower-cased) before every lookup/insert, so
// `Foo@Example.com` and `foo@example.com` collide on the same row rather
// than the table's `unique` constraint on `email` depending on Postgres's
// (case-sensitive) `text` comparison to catch it.
//
// Because `subscribers.email` is unique for the table's whole lifetime (not
// just while pending — see schema/subscribers.ts), this never blindly
// inserts: it reads first and branches on the existing row's `status`,
// so a duplicate submission never surfaces as an uncaught unique-constraint
// violation.
//   - No existing row → insert a new `pending` row (schema defaults
//     generate its `id`/`confirmationToken`/`subscribedAt`).
//   - Existing `pending` row → returned as-is. The token/subscribedAt are
//     deliberately NOT rotated: the confirmation email already sent for
//     this row embeds that same token, and regenerating it here would
//     silently break that link.
//   - Existing `active` row → returned as-is; the caller surfaces the
//     "already subscribed" inline error rather than attempting an insert.
export async function createPendingSubscriber(
  email: string,
): Promise<TCreatePendingSubscriberResult> {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, normalizedEmail));

  if (existing?.status === 'active') {
    return { outcome: 'already-active', subscriber: existing };
  }

  if (existing?.status === 'pending') {
    return { outcome: 'already-pending', subscriber: existing };
  }

  const [inserted] = await db
    .insert(subscribers)
    .values({ email: normalizedEmail })
    .returning();

  if (!inserted) {
    // Unreachable in practice: the read above already ruled out an existing
    // row for this email, so the insert has nothing to conflict with.
    // Thrown rather than silently returning `undefined` so a real
    // regression here surfaces immediately instead of as a confusing
    // downstream crash.
    throw new Error(
      `createPendingSubscriber: insert for "${normalizedEmail}" returned no row.`,
    );
  }

  return { outcome: 'created', subscriber: inserted };
}
