import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE, type TTenantPlan } from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import { insertTenantWithDependents } from '@blog/db/queries/tenants/insert-tenant-with-dependents';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import type { TTenant } from '@blog/db/schema/tenants';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { normalizeLocaleCode } from '@blog/db/utils/normalize-locale-code/normalize-locale-code';
import { errorResult, okResult, type TResult } from '@blog/utils';

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
