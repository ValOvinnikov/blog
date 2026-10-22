import {
  SUBSCRIBER_OUTCOME,
  ERROR_CODE,
  type TErrorCode,
} from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import {
  personalEmailColumns,
  requireDecryptedPersonalValue,
  requirePersonalEmailIndex,
} from '@blog/db/utils/personal-data/personal-data';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { and, eq } from 'drizzle-orm';

export type TPendingSubscriber = {
  id: string;
  email: string;
};

export interface ICreatePendingSubscriberResult {
  outcome:
    | typeof SUBSCRIBER_OUTCOME.CREATED
    | typeof SUBSCRIBER_OUTCOME.ALREADY_PENDING
    | typeof SUBSCRIBER_OUTCOME.ALREADY_ACTIVE;
  subscriber: TPendingSubscriber;
}

type TCreatePendingSubscriberResult = TResult<
  ICreatePendingSubscriberResult,
  TErrorCode
>;

async function findExisting(
  tenantId: string,
  emailIndex: string,
): Promise<TMaybeUndefined<TCreatePendingSubscriberResult>> {
  const [existing] = await getDb()
    .select({
      id: subscribers.id,
      status: subscribers.status,
      emailEncrypted: subscribers.emailEncrypted,
    })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.emailIndex, emailIndex),
      ),
    );
  if (!existing) return undefined;

  const { id, status, emailEncrypted } = existing;
  return okResult({
    outcome:
      status === 'active'
        ? SUBSCRIBER_OUTCOME.ALREADY_ACTIVE
        : SUBSCRIBER_OUTCOME.ALREADY_PENDING,
    subscriber: {
      id,
      email: requireDecryptedPersonalValue(emailEncrypted, 'Subscriber'),
    },
  });
}

// Reads again after a conflicting insert, so two concurrent signups for one
// new email resolve through the unique constraint instead of one throwing.
export async function createPendingSubscriber(
  tenantId: string,
  email: string,
): Promise<TCreatePendingSubscriberResult> {
  const normalizedEmail = normalizeEmail(email);
  const emailIndex = requirePersonalEmailIndex(normalizedEmail);

  const existing = await findExisting(tenantId, emailIndex);
  if (existing) return existing;

  const [inserted] = await getDb()
    .insert(subscribers)
    .values({
      tenantId,
      email: normalizedEmail,
      ...personalEmailColumns(normalizedEmail),
    })
    .onConflictDoNothing()
    .returning({ id: subscribers.id });

  if (inserted) {
    return okResult({
      outcome: SUBSCRIBER_OUTCOME.CREATED,
      subscriber: { id: inserted.id, email: normalizedEmail },
    });
  }

  return (
    (await findExisting(tenantId, emailIndex)) ??
    errorResult(ERROR_CODE.DB_NOT_FOUND)
  );
}
