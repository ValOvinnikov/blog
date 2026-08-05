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
// is normalized (trimmed, lower-cased) before every insert/lookup, so
// `Foo@Example.com` and `foo@example.com` collide on the same row rather
// than the table's `unique` constraint on `email` depending on Postgres's
// (case-sensitive) `text` comparison to catch it.
//
// Because `subscribers.email` is unique for the table's whole lifetime (not
// just while pending — see schema/subscribers.ts), this never reads first
// to decide whether to insert: two concurrent calls for the same brand-new
// email (double-click on submit, a client retry, two tabs) could otherwise
// both see no existing row and both attempt the insert, leaving one to
// throw a raw unique-constraint violation. Instead this inserts first and
// only falls back to a read if the insert no-ops on that same `email`
// conflict — the uniqueness guarantee comes from Postgres's constraint, not
// from a racy read-then-decide, so a duplicate submission never surfaces as
// an uncaught constraint error even under concurrency.
//   - Insert succeeds → a brand-new `pending` row (schema defaults
//     generate its `id`/`confirmationToken`/`subscribedAt`).
//   - Insert no-ops, existing row is `pending` → returned as-is. The
//     token/subscribedAt are deliberately NOT rotated: the confirmation
//     email already sent for this row embeds that same token, and
//     regenerating it here would silently break that link.
//   - Insert no-ops, existing row is `active` → returned as-is; the caller
//     surfaces the "already subscribed" inline error rather than
//     attempting an insert.
export async function createPendingSubscriber(
  email: string,
): Promise<TCreatePendingSubscriberResult> {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const [inserted] = await db
    .insert(subscribers)
    .values({ email: normalizedEmail })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    return { outcome: 'created', subscriber: inserted };
  }

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, normalizedEmail));

  if (!existing) {
    // Unreachable in practice: the insert only no-ops on an `email`
    // conflict, which means a row satisfying this exact where already
    // exists. Thrown rather than silently returning `undefined` so a real
    // regression here surfaces immediately instead of as a confusing
    // downstream crash.
    throw new Error(
      `createPendingSubscriber: expected an existing row for "${normalizedEmail}" after a no-op insert.`,
    );
  }

  if (existing.status === 'active') {
    return { outcome: 'already-active', subscriber: existing };
  }

  return { outcome: 'already-pending', subscriber: existing };
}
