'use server';

import {
  ENTITLEMENT_GRANT_LOG,
  ENTITLEMENT_GRANT_REFUSAL,
  type TEntitlementGrantRefusal,
} from '@platform/constants/entitlement-grant';
import type { TENANT_REFUSAL } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { resolveLiveTenant } from '@platform/server/tenants/resolve-live-tenant';
import { grantExpiresAt } from '@platform/utils/grant-expires-at/grant-expires-at';
import { isCoveredByPlan } from '@platform/utils/is-covered-by-plan/is-covered-by-plan';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  isComingSoonCapability,
  isOutcomeSuccess,
  type TActionResult,
  type TErrorCode,
} from '@shinefold/config';
import { ENTITLEMENT_KIND, queries } from '@shinefold/db';
import { toStoredEntitlementItem } from '@shinefold/db/utils/stored-entitlement-item/stored-entitlement-item';
import { toOutcome } from '@shinefold/utils/to-outcome';

import {
  entitlementGrantInputSchema,
  type TEntitlementGrantInput,
} from './entitlement-grant-input-schema';
import { notifyOwnerOfEntitlementGrant } from './notify-owner-of-entitlement-change';

export type TGrantEntitlementResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  keyof TEntitlementGrantInput,
  never,
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED
  | TEntitlementGrantRefusal
>;

const REFUSAL_BY_ERROR: Partial<Record<TErrorCode, TEntitlementGrantRefusal>> =
  {
    [ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED]:
      ENTITLEMENT_GRANT_REFUSAL.ALREADY_GRANTED,
    [ERROR_CODE.DB_ENTITLEMENT_EXPIRY_SHORTENED]:
      ENTITLEMENT_GRANT_REFUSAL.EXPIRY_SHORTENED,
  };

export const grantEntitlementAction = async (
  tenantId: string,
  input: TEntitlementGrantInput,
): Promise<TGrantEntitlementResult> => {
  const admin = await requireSuperAdmin();

  const parsed = entitlementGrantInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { item, expiry, note } = parsed.data;
  if (
    item.kind === ENTITLEMENT_KIND.CAPABILITY &&
    isComingSoonCapability(item.key)
  ) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: ENTITLEMENT_GRANT_REFUSAL.COMING_SOON,
    };
  }

  const resolved = await resolveLiveTenant(tenantId);
  if (!isOutcomeSuccess(resolved)) return resolved;

  const { tenant } = resolved;
  if (isCoveredByPlan(tenant.plan, toStoredEntitlementItem(item))) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: ENTITLEMENT_GRANT_REFUSAL.INCLUDED_IN_PLAN,
    };
  }

  try {
    const expiresAt = grantExpiresAt(expiry, new Date());
    const granted = await queries.tenantEntitlementGrants.grantEntitlement({
      tenantId,
      item,
      grantedBy: admin.id,
      expiresAt,
      note,
    });

    if (!granted.ok) {
      const reason = REFUSAL_BY_ERROR[granted.error];
      if (reason) return { outcome: ACTION_OUTCOME.REFUSED, reason };
      throw new Error(granted.error);
    }

    const { grant, closedGrantId } = granted.data;
    const { id, kind, key, value } = grant;
    await revalidateSiteConfig(tenantId);
    if (closedGrantId) {
      await recordAuditEvent({
        logEvent: ENTITLEMENT_GRANT_LOG.REVOKE_AUDIT_FAILED,
        action: AUDIT_ACTION.ENTITLEMENT_REVOKED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: tenantId,
        details: { grantId: closedGrantId, kind, key, replacedBy: id },
      });
    }
    await recordAuditEvent({
      logEvent: ENTITLEMENT_GRANT_LOG.GRANT_AUDIT_FAILED,
      action: AUDIT_ACTION.ENTITLEMENT_GRANTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: { grantId: id, kind, key, value, expiresAt, note },
    });
    await notifyOwnerOfEntitlementGrant(tenant, grant);
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(ENTITLEMENT_GRANT_LOG.GRANT_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
