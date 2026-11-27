import {
  ERROR_CODE,
  type TErrorCode,
  type TTenantPlan,
} from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { MEMBERSHIP_ROLE, TENANT_STATUS } from '@shinefold/db/constants';
import { inviteEmailColumns } from '@shinefold/db/queries/membership-invites/invite-email-columns';
import { insertTenantWithDependents } from '@shinefold/db/queries/tenants/insert-tenant-with-dependents';
import { membershipInvites } from '@shinefold/db/schema/membership-invites';
import { memberships } from '@shinefold/db/schema/memberships';
import { tenantDomains } from '@shinefold/db/schema/tenant-domains';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isValidDomain } from '@shinefold/db/utils/is-valid-domain/is-valid-domain';
import { normalizeLocaleCode } from '@shinefold/db/utils/normalize-locale-code/normalize-locale-code';
import { errorResult, okResult, type TResult } from '@shinefold/utils';

export type TDraftOwner =
  { type: 'user'; userId: string } | { type: 'invite'; email: string };

export type TCreateTenantDraftInput = {
  name: string;
  domain: string;
  locale: string;
  plan: TTenantPlan;
  owner: TDraftOwner;
};

export async function createTenantDraft(
  input: TCreateTenantDraftInput,
): Promise<TResult<TTenant, TErrorCode>> {
  if (!isValidDomain(input.domain)) {
    return errorResult(ERROR_CODE.DB_INVALID_DOMAIN);
  }

  const db = getDb();

  const tenant = await insertTenantWithDependents(
    {
      name: input.name,
      primaryDomain: input.domain,
      locale: normalizeLocaleCode(input.locale),
      plan: input.plan,
      status: TENANT_STATUS.ACTIVE,
      createdFromPlatform: true,
    },
    async ({ id: tenantId }) => {
      const ownerInsert =
        input.owner.type === 'user'
          ? db
              .insert(memberships)
              .values({
                tenantId,
                userId: input.owner.userId,
                role: MEMBERSHIP_ROLE.OWNER,
              })
              .returning()
          : db
              .insert(membershipInvites)
              .values({
                tenantId,
                ...inviteEmailColumns(input.owner.email),
                role: MEMBERSHIP_ROLE.OWNER,
              })
              .returning();

      const [domainRow, ownerRow] = await Promise.all([
        db
          .insert(tenantDomains)
          .values({ tenantId, domain: input.domain })
          .returning(),
        ownerInsert,
      ]);

      if (!domainRow[0]) {
        throw new Error(
          `createTenantDraft: tenant_domains insert for tenant "${tenantId}" returned no row.`,
        );
      }

      if (!ownerRow[0]) {
        const table =
          input.owner.type === 'user' ? 'memberships' : 'membership_invites';
        throw new Error(
          `createTenantDraft: ${table} insert for tenant "${tenantId}" returned no row.`,
        );
      }
    },
  );

  return okResult(tenant);
}
