'use server';

import {
  ENTITLEMENT_GRANT_LOG,
  ENTITLEMENT_GRANT_REFUSAL,
} from '@platform/constants/entitlement-grant';
import type { TENANT_REFUSAL } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { resolveLiveTenant } from '@platform/server/tenants/resolve-live-tenant';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  isOutcomeSuccess,
  type TActionResult,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { z } from 'zod';

export type TRevokeEntitlementGrantResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED
  | typeof ENTITLEMENT_GRANT_REFUSAL.GRANT_NOT_OPEN
>;

export const revokeEntitlementGrantAction = async (
  tenantId: string,
  grantId: string,
): Promise<TRevokeEntitlementGrantResult> => {
  const admin = await requireSuperAdmin();

  if (!z.uuid().safeParse(grantId).success) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: ENTITLEMENT_GRANT_REFUSAL.GRANT_NOT_OPEN,
    };
  }

  const resolved = await resolveLiveTenant(tenantId);
  if (!isOutcomeSuccess(resolved)) return resolved;

  try {
    const revoked =
      await queries.tenantEntitlementGrants.revokeEntitlementGrant(
        tenantId,
        grantId,
        admin.id,
      );

    if (!revoked) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: ENTITLEMENT_GRANT_REFUSAL.GRANT_NOT_OPEN,
      };
    }

    const { kind, key, value, expiresAt, note } = revoked;
    await revalidateSiteConfig(tenantId);
    await recordAuditEvent({
      logEvent: ENTITLEMENT_GRANT_LOG.REVOKE_AUDIT_FAILED,
      action: AUDIT_ACTION.ENTITLEMENT_REVOKED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: { grantId, kind, key, value, expiresAt, note },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(ENTITLEMENT_GRANT_LOG.REVOKE_FAILED, {
      tenantId,
      grantId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
