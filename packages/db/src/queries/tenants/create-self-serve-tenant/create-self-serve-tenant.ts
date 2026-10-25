import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  type TErrorCode,
  type TPresetId,
  type TSiteType,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events/insert-audit-event';
import { upsertSettingsFeatures } from '@blog/db/queries/settings-features/upsert-settings-features';
import { insertSiteConfigIfMissing } from '@blog/db/queries/site-config/insert-site-config-if-missing';
import { getTenantByDomain } from '@blog/db/queries/tenant-domains/get-tenant-by-domain';
import { insertTenantWithDependents } from '@blog/db/queries/tenants/insert-tenant-with-dependents';
import { ownsFreeTenant } from '@blog/db/queries/tenants/owns-free-tenant';
import { memberships } from '@blog/db/schema/memberships';
import {
  TENANT_DOMAINS_DOMAIN_UNIQUE_NAME,
  tenantDomains,
} from '@blog/db/schema/tenant-domains';
import {
  SELF_SERVE_FREE_OWNER_INDEX_NAME,
  type TTenant,
} from '@blog/db/schema/tenants';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { normalizeLocaleCode } from '@blog/db/utils/normalize-locale-code/normalize-locale-code';
import { normalizeSignupEmail } from '@blog/db/utils/normalize-signup-identity/normalize-signup-identity';
import { requireEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { uniqueViolationConstraint } from '@blog/db/utils/unique-violation/unique-violation';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { personalDataIndex } from '@blog/utils/encryption';

const REFUSAL_BY_CONSTRAINT: Partial<Record<string, TErrorCode>> = {
  [SELF_SERVE_FREE_OWNER_INDEX_NAME]: ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT,
  [TENANT_DOMAINS_DOMAIN_UNIQUE_NAME]: ERROR_CODE.DB_DUPLICATE_DOMAIN,
};

export type TCreateSelfServeTenantInput = {
  name: string;
  domain: string;
  locale: string;
  siteType: TSiteType;
  preset: TPresetId;
  accentHue: number;
  owner: { userId: string; email: string };
};

export async function createSelfServeTenant(
  input: TCreateSelfServeTenantInput,
): Promise<TResult<TTenant, TErrorCode>> {
  const { name, domain, locale, siteType, preset, accentHue, owner } = input;

  if (!isValidDomain(domain)) {
    return errorResult(ERROR_CODE.DB_INVALID_DOMAIN);
  }

  const normalizedEmail = normalizeSignupEmail(owner.email);
  if (!normalizedEmail) {
    return errorResult(ERROR_CODE.DB_INVALID_EMAIL);
  }

  const owned = await ownsFreeTenant(owner.email);
  if (!owned.ok) return owned;
  if (owned.data) {
    return errorResult(ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT);
  }

  if (await getTenantByDomain(domain)) {
    return errorResult(ERROR_CODE.DB_DUPLICATE_DOMAIN);
  }

  const db = getDb();

  try {
    const tenant = await insertTenantWithDependents(
      {
        name,
        primaryDomain: domain,
        locale: normalizeLocaleCode(locale),
        plan: TENANT_PLAN.FREE,
        siteType,
        selfServeOwnerEmailIndex: requireEmailIndex(
          normalizedEmail.address,
          personalDataIndex,
        ),
      },
      async ({ id: tenantId }) => {
        await Promise.all([
          db.insert(tenantDomains).values({ tenantId, domain }),
          db.insert(memberships).values({
            tenantId,
            userId: owner.userId,
            role: MEMBERSHIP_ROLE.OWNER,
          }),
          insertSiteConfigIfMissing(tenantId, preset, accentHue),
          upsertSettingsFeatures(tenantId, {}),
        ]);

        await insertAuditEvent({
          actorId: owner.userId,
          action: AUDIT_ACTION.CREATED,
          targetType: AUDIT_TARGET_TYPE.TENANT,
          targetId: tenantId,
          details: {
            name,
            domain,
            plan: TENANT_PLAN.FREE,
            siteType,
            ownerUserId: owner.userId,
          },
        });
      },
    );

    return okResult(tenant);
  } catch (error) {
    const constraint = uniqueViolationConstraint(error);
    const refusal =
      constraint === undefined ? undefined : REFUSAL_BY_CONSTRAINT[constraint];
    if (refusal) return errorResult(refusal);
    throw error;
  }
}
