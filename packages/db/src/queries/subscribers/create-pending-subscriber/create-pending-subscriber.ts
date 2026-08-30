import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import type { TResult } from '@blog/utils';
import { and, eq } from 'drizzle-orm';

// The three shapes a newsletter signup form's submit action needs to
// distinguish: a brand-new signup, a re-submission while a confirmation
// email is still unconfirmed, and an "already subscribed" inline error for
// an email that's already `active`. All three carry the row itself so the
// caller (e.g. to re-send the confirmation email using the existing token)
// doesn't need a second read.
export type TCreatePendingSubscriberResult =
  | { outcome: 'created'; subscriber: TSubscriber }
  | { outcome: 'already-pending'; subscriber: TSubscriber }
  | { outcome: 'already-active'; subscriber: TSubscriber };

// Creates a pending subscriber row for `email` — the newsletter signup
// form's submit action (double opt-in). `email` is normalized (trimmed,
// lower-cased) before every insert/lookup, so
// `Foo@Example.com` and `foo@example.com` collide on the same row rather
// than the table's `unique` constraint on `email` depending on Postgres's
// (case-sensitive) `text` comparison to catch it.
//
// Because `(tenantId, email)` is unique for the table's whole lifetime (not
// just while pending — see schema/subscribers.ts), this never reads first
// to decide whether to insert: two concurrent calls for the same brand-new
// email (double-click on submit, a client retry, two tabs) could otherwise
// both see no existing row and both attempt the insert, leaving one to
// throw a raw unique-constraint violation. Instead this inserts first and
// only falls back to a read if the insert no-ops on that same `(tenantId,
// email)` conflict — the uniqueness guarantee comes from Postgres's
// constraint, not from a racy read-then-decide, so a duplicate submission
// never surfaces as an uncaught constraint error even under concurrency.
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
  tenantId: string,
  email: string,
): Promise<TResult<TCreatePendingSubscriberResult, TErrorCode>> {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  const [inserted] = await db
    .insert(subscribers)
    .values({ tenantId, email: normalizedEmail })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    return { ok: true, data: { outcome: 'created', subscriber: inserted } };
  }

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.email, normalizedEmail),
      ),
    );

  if (!existing) {
    // A real, if narrow, race: the insert no-ops on a (tenantId, email) conflict, but `unsubscribe` can delete that row before this read.
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  if (existing.status === 'active') {
    return {
      ok: true,
      data: { outcome: 'already-active', subscriber: existing },
    };
  }

  return {
    ok: true,
    data: { outcome: 'already-pending', subscriber: existing },
  };
}
