import {
  SUBSCRIBER_OUTCOME,
  ERROR_CODE,
  type TErrorCode,
} from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { findSubscriberByExactEmail } from '@blog/db/queries/subscribers/user-subscriber';
import { subscribers } from '@blog/db/schema/subscribers';
import { emailColumns } from '@blog/db/utils/personal-data/personal-data';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { personalDataIndex } from '@blog/utils/encryption';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';

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
  normalizedEmail: string,
): Promise<TMaybeUndefined<TCreatePendingSubscriberResult>> {
  const existing = await findSubscriberByExactEmail(tenantId, normalizedEmail);
  if (!existing) return undefined;

  const { id, status, email } = existing;
  return okResult({
    outcome:
      status === 'active'
        ? SUBSCRIBER_OUTCOME.ALREADY_ACTIVE
        : SUBSCRIBER_OUTCOME.ALREADY_PENDING,
    subscriber: { id, email },
  });
}

// Reads again after a conflicting insert, so two concurrent signups for one
// new email resolve through the unique constraint instead of one throwing.
export async function createPendingSubscriber(
  tenantId: string,
  email: string,
): Promise<TCreatePendingSubscriberResult> {
  const normalizedEmail = normalizeEmail(email);

  const existing = await findExisting(tenantId, normalizedEmail);
  if (existing) return existing;

  const [inserted] = await getDb()
    .insert(subscribers)
    .values({
      tenantId,
      email: normalizedEmail,
      ...emailColumns(normalizedEmail, personalDataIndex),
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
    (await findExisting(tenantId, normalizedEmail)) ??
    errorResult(ERROR_CODE.DB_NOT_FOUND)
  );
}
