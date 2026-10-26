import {
  ERROR_CODE,
  type TAuditAction,
  type TAuditTargetType,
  type TErrorCode,
} from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  isBlockedAddress,
  toPersonalEmailIndex,
} from '@blog/db/queries/personal-data/personal-data-match';
import {
  findReaderAccountPersonalData,
  type TPersonalDataReaderAccount,
} from '@blog/db/queries/personal-data/reader-account-personal-data';
import { findSitePersonalData } from '@blog/db/queries/personal-data/site-personal-data';
import type { TSitePersonalData } from '@blog/db/queries/personal-data/site-personal-data-types';
import { findUserByEmail } from '@blog/db/queries/users/find-user-by-email';
import { auditEvents } from '@blog/db/schema/audit-events';
import { blockedSignupIdentities } from '@blog/db/schema/blocked-signup-identities';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { desc, eq } from 'drizzle-orm';

export type TPersonalDataBlock = {
  id: string;
  reason: string;
  createdAt: Date;
};

export type TPersonalDataAuditEvent = {
  id: string;
  action: TAuditAction;
  targetType: TAuditTargetType;
  targetId: string;
  createdAt: Date;
};

export type TPersonalDataMatches = TSitePersonalData & {
  emailIndex: string;
  readerAccount: TMaybeUndefined<TPersonalDataReaderAccount>;
  blockedSignupIdentities: TPersonalDataBlock[];
  auditEvents: TPersonalDataAuditEvent[];
};

async function findAuditEventsBy(
  actorId: string,
): Promise<TPersonalDataAuditEvent[]> {
  return getDb()
    .select({
      id: auditEvents.id,
      action: auditEvents.action,
      targetType: auditEvents.targetType,
      targetId: auditEvents.targetId,
      createdAt: auditEvents.createdAt,
    })
    .from(auditEvents)
    .where(eq(auditEvents.actorId, actorId))
    .orderBy(desc(auditEvents.createdAt));
}

// Returns decrypted values and performs no authorization: callers gate it to operators.
export async function findPersonalData(
  email: string,
): Promise<TResult<TPersonalDataMatches, TErrorCode>> {
  const emailIndex = toPersonalEmailIndex(email);
  if (!emailIndex) return errorResult(ERROR_CODE.DB_INVALID_EMAIL);

  const user = await findUserByEmail(email.trim());

  const [siteData, blockRows, readerAccount, auditRows] = await Promise.all([
    findSitePersonalData(emailIndex),
    getDb()
      .select({
        id: blockedSignupIdentities.id,
        reason: blockedSignupIdentities.reason,
        createdAt: blockedSignupIdentities.createdAt,
      })
      .from(blockedSignupIdentities)
      .where(isBlockedAddress(emailIndex)),
    user && findReaderAccountPersonalData(user),
    user ? findAuditEventsBy(user.id) : [],
  ]);

  return okResult({
    emailIndex,
    ...siteData,
    readerAccount,
    blockedSignupIdentities: blockRows,
    auditEvents: auditRows,
  });
}
