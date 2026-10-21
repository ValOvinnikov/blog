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
  hashSignupAddress,
  normalizeSignupDomain,
  normalizeSignupEmail,
} from '@blog/db/utils/normalize-signup-identity/normalize-signup-identity';
import type { TResult } from '@blog/utils';
import { and, eq } from 'drizzle-orm';

export type TAddBlockedIdentityInput = {
  kind: TBlockedIdentityKind;
  identity: string;
  reason: string;
  createdByAdminId: string;
};

async function toStoredValue(
  kind: TBlockedIdentityKind,
  identity: string,
): Promise<TResult<string, TErrorCode>> {
  if (kind === BLOCKED_IDENTITY_KIND.DOMAIN) {
    const domain = normalizeSignupDomain(identity);

    return domain
      ? { ok: true, data: domain }
      : { ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN };
  }

  const email = normalizeSignupEmail(identity);

  return email
    ? { ok: true, data: await hashSignupAddress(email.address) }
    : { ok: false, error: ERROR_CODE.DB_INVALID_EMAIL };
}

// Idempotent: an entry already on the list is returned as it stands, keeping
// its original reason and author.
export async function addBlockedIdentity({
  kind,
  identity,
  reason,
  createdByAdminId,
}: TAddBlockedIdentityInput): Promise<
  TResult<TBlockedSignupIdentity, TErrorCode>
> {
  const value = await toStoredValue(kind, identity);

  if (!value.ok) return value;

  const db = getDb();

  const [inserted] = await db
    .insert(blockedSignupIdentities)
    .values({ kind, value: value.data, reason, createdByAdminId })
    .onConflictDoNothing()
    .returning();

  if (inserted) return { ok: true, data: inserted };

  const [existing] = await db
    .select()
    .from(blockedSignupIdentities)
    .where(
      and(
        eq(blockedSignupIdentities.kind, kind),
        eq(blockedSignupIdentities.value, value.data),
      ),
    );

  if (!existing) return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };

  return { ok: true, data: existing };
}
