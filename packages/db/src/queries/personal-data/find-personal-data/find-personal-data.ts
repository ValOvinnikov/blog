import {
  ERROR_CODE,
  type TAuditAction,
  type TAuditTargetType,
  type TErrorCode,
} from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  isAuditActor,
  isBlockedAddress,
  toPersonalDataMatch,
} from '@blog/db/queries/personal-data/personal-data-match';
import {
  findSitePersonalData,
  type TSitePersonalData,
} from '@blog/db/queries/personal-data/site-personal-data';
import { auditEvents } from '@blog/db/schema/audit-events';
import { blockedSignupIdentities } from '@blog/db/schema/blocked-signup-identities';
import type { TResult } from '@blog/utils';
import { desc } from 'drizzle-orm';

export type TPersonalDataBlock = {
  id: string;
  reason: string;
  createdAt: Date;
};

export type TPersonalDataAuditEvent = {
  id: string;
  email: TMaybeUndefined<string>;
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
  const match = toPersonalDataMatch(email);
  if (!match) return { ok: false, error: ERROR_CODE.DB_INVALID_EMAIL };

  const { emailIndex, mailbox } = match;
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
        actorEmail: auditEvents.actorEmail,
        action: auditEvents.action,
        targetType: auditEvents.targetType,
        targetId: auditEvents.targetId,
        createdAt: auditEvents.createdAt,
      })
      .from(auditEvents)
      .where(isAuditActor(mailbox))
      .orderBy(desc(auditEvents.createdAt)),
  ]);

  return {
    ok: true,
    data: {
      emailIndex,
      ...siteData,
      blockedSignupIdentities: blockRows,
      auditEvents: auditRows.map(({ actorEmail, ...event }) => ({
        ...event,
        email: actorEmail ?? undefined,
      })),
    },
  };
}
