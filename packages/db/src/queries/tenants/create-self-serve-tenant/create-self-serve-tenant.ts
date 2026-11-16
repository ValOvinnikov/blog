import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  type TErrorCode,
  type TPresetId,
  type TSiteType,
} from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { insertAuditEvent } from '@shinefold/db/queries/audit-events/insert-audit-event';
import { upsertSettingsFeatures } from '@shinefold/db/queries/settings-features/upsert-settings-features';
import { insertSiteConfigIfMissing } from '@shinefold/db/queries/site-config/insert-site-config-if-missing';
import { getTenantByDomain } from '@shinefold/db/queries/tenant-domains/get-tenant-by-domain';
import { insertTenantWithDependents } from '@shinefold/db/queries/tenants/insert-tenant-with-dependents';
import { ownsFreeTenant } from '@shinefold/db/queries/tenants/owns-free-tenant';
import { selfServeTrialValues } from '@shinefold/db/queries/tenants/self-serve-trial-values';
import { memberships } from '@shinefold/db/schema/memberships';
import {
  TENANT_DOMAINS_DOMAIN_UNIQUE_NAME,
  tenantDomains,
} from '@shinefold/db/schema/tenant-domains';
import { SELF_SERVE_FREE_OWNER_INDEX_NAME } from '@shinefold/db/schema/tenant-self-serve-owner-index';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { uniqueViolationConstraint } from '@shinefold/db/utils/constraint-violation/constraint-violation';
import { isValidDomain } from '@shinefold/db/utils/is-valid-domain/is-valid-domain';
import { normalizeLocaleCode } from '@shinefold/db/utils/normalize-locale-code/normalize-locale-code';
import { normalizeSignupEmail } from '@shinefold/db/utils/normalize-signup-identity/normalize-signup-identity';
import { requireEmailIndex } from '@shinefold/db/utils/personal-data/personal-data';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { personalDataIndex } from '@shinefold/utils/encryption';
import { isUndefined } from '@shinefold/utils/primitives';

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
  const trial = selfServeTrialValues(new Date());

  try {
    const tenant = await insertTenantWithDependents(
      {
        name,
        primaryDomain: domain,
        locale: normalizeLocaleCode(locale),
        ...trial,
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
            plan: trial.plan,
            siteType,
            ownerUserId: owner.userId,
          },
        });
      },
    );

    return okResult(tenant);
  } catch (error) {
    const constraint = uniqueViolationConstraint(error);
    const refusal = isUndefined(constraint)
      ? undefined
      : REFUSAL_BY_CONSTRAINT[constraint];
    if (refusal) return errorResult(refusal);
    throw error;
  }
}
