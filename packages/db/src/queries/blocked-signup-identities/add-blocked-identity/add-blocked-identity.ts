import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  BLOCKED_IDENTITY_KIND,
  type TBlockedIdentityKind,
} from '@blog/db/constants';
import {
  blockedSignupIdentities,
  type TBlockedSignupIdentity,
} from '@blog/db/schema/blocked-signup-identities';
import {
  normalizeSignupDomain,
  normalizeSignupEmail,
} from '@blog/db/utils/normalize-signup-identity/normalize-signup-identity';
import { requireEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { personalDataIndex } from '@blog/utils/encryption';
import { and, eq } from 'drizzle-orm';

export type TAddBlockedIdentityInput = {
  kind: TBlockedIdentityKind;
  identity: string;
  reason: string;
  createdByAdminId: string;
};

function toStoredValue(
  kind: TBlockedIdentityKind,
  identity: string,
): TResult<string, TErrorCode> {
  if (kind === BLOCKED_IDENTITY_KIND.DOMAIN) {
    const domain = normalizeSignupDomain(identity);

    return domain
      ? okResult(domain)
      : errorResult(ERROR_CODE.DB_INVALID_DOMAIN);
  }

  const email = normalizeSignupEmail(identity);

  return email
    ? okResult(requireEmailIndex(email.address, personalDataIndex))
    : errorResult(ERROR_CODE.DB_INVALID_EMAIL);
}

export type TAddBlockedIdentityOutcome = {
  entry: TBlockedSignupIdentity;
  created: boolean;
};

// Idempotent: an entry already on the list is returned as it stands, keeping
// its original reason and author, with `created` false.
export async function addBlockedIdentity({
  kind,
  identity,
  reason,
  createdByAdminId,
}: TAddBlockedIdentityInput): Promise<
  TResult<TAddBlockedIdentityOutcome, TErrorCode>
> {
  const value = toStoredValue(kind, identity);

  if (!value.ok) return value;

  const db = getDb();

  const [inserted] = await db
    .insert(blockedSignupIdentities)
    .values({ kind, value: value.data, reason, createdByAdminId })
    .onConflictDoNothing()
    .returning();

  if (inserted) return okResult({ entry: inserted, created: true });

  const [existing] = await db
    .select()
    .from(blockedSignupIdentities)
    .where(
      and(
        eq(blockedSignupIdentities.kind, kind),
        eq(blockedSignupIdentities.value, value.data),
      ),
    );

  if (!existing) return errorResult(ERROR_CODE.DB_NOT_FOUND);

  return okResult({ entry: existing, created: false });
}
