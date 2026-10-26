import {
  ERROR_CODE,
  type TAuditAction,
  type TAuditTargetType,
  type TErrorCode,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  isBlockedAddress,
  toPersonalEmailIndex,
} from '@blog/db/queries/personal-data/personal-data-match';
import { findSitePersonalData } from '@blog/db/queries/personal-data/site-personal-data';
import type { TSitePersonalData } from '@blog/db/queries/personal-data/site-personal-data-types';
import { auditEvents } from '@blog/db/schema/audit-events';
import { users } from '@blog/db/schema/auth';
import { blockedSignupIdentities } from '@blog/db/schema/blocked-signup-identities';
import { requireEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { accountEmailIndex } from '@blog/utils/encryption';
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
  blockedSignupIdentities: TPersonalDataBlock[];
  auditEvents: TPersonalDataAuditEvent[];
};

// Returns decrypted values and performs no authorization: callers gate it to operators.
export async function findPersonalData(
  email: string,
): Promise<TResult<TPersonalDataMatches, TErrorCode>> {
  const emailIndex = toPersonalEmailIndex(email);
  if (!emailIndex) return errorResult(ERROR_CODE.DB_INVALID_EMAIL);

  const db = getDb();

  const [siteData, blockRows, auditRows] = await Promise.all([
    findSitePersonalData(emailIndex),
    db
      .select({
        id: blockedSignupIdentities.id,
        reason: blockedSignupIdentities.reason,
        createdAt: blockedSignupIdentities.createdAt,
      })
      .from(blockedSignupIdentities)
      .where(isBlockedAddress(emailIndex)),
    db
      .select({
        id: auditEvents.id,
        action: auditEvents.action,
        targetType: auditEvents.targetType,
        targetId: auditEvents.targetId,
        createdAt: auditEvents.createdAt,
      })
      .from(auditEvents)
      .innerJoin(users, eq(users.id, auditEvents.actorId))
      .where(eq(users.emailIndex, requireEmailIndex(email, accountEmailIndex)))
      .orderBy(desc(auditEvents.createdAt)),
  ]);

  return okResult({
    emailIndex,
    ...siteData,
    blockedSignupIdentities: blockRows,
    auditEvents: auditRows,
  });
}
