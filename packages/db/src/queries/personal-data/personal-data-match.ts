import type { TMaybeUndefined } from '@blog/config/types';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { auditEvents } from '@blog/db/schema/audit-events';
import { blockedSignupIdentities } from '@blog/db/schema/blocked-signup-identities';
import { normalizeSignupEmail } from '@blog/db/utils/normalize-signup-identity/normalize-signup-identity';
import { requireEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@blog/utils/encryption';
import { and, eq, type SQL, sql } from 'drizzle-orm';

export type TPersonalDataMatch = {
  emailIndex: string;
  mailbox: string;
};

export function toPersonalDataMatch(
  email: string,
): TMaybeUndefined<TPersonalDataMatch> {
  const normalized = normalizeSignupEmail(email);
  if (!normalized) return undefined;

  return {
    emailIndex: requireEmailIndex(normalized.address, personalDataIndex),
    mailbox: normalized.address,
  };
}

export function isBlockedAddress(emailIndex: string): TMaybeUndefined<SQL> {
  return and(
    eq(blockedSignupIdentities.kind, BLOCKED_IDENTITY_KIND.ADDRESS),
    eq(blockedSignupIdentities.value, emailIndex),
  );
}

// Mirrors `normalizeEmailIdentity` in SQL, so `Ada+news@Example.com` matches `ada@example.com` as the index does.
export function isAuditActor(mailbox: string): SQL {
  return eq(
    sql`regexp_replace(lower(btrim(${auditEvents.actorEmail})), '\\+[^@]*@', '@')`,
    mailbox,
  );
}
