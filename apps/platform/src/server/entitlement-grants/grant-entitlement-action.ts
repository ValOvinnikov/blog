'use server';

import {
  ENTITLEMENT_GRANT_FIELD_ERROR,
  ENTITLEMENT_GRANT_LOG,
  ENTITLEMENT_GRANT_REFUSAL,
  type TEntitlementGrantFieldError,
  type TEntitlementGrantRefusal,
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
  ERROR_CODE,
  isComingSoonCapability,
  isOutcomeSuccess,
  type TActionResult,
} from '@shinefold/config';
import { ENTITLEMENT_KIND, queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';

import {
  entitlementGrantInputSchema,
  type TEntitlementGrantInput,
} from './entitlement-grant-input-schema';

export type TGrantEntitlementResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'expiresAt',
  TEntitlementGrantFieldError,
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED
  | TEntitlementGrantRefusal
>;

export const grantEntitlementAction = async (
  tenantId: string,
  input: TEntitlementGrantInput,
): Promise<TGrantEntitlementResult> => {
  const admin = await requireSuperAdmin();

  const parsed = entitlementGrantInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { item, expiresAt, note } = parsed.data;
  if (expiresAt && expiresAt <= new Date()) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        expiresAt: { reason: ENTITLEMENT_GRANT_FIELD_ERROR.EXPIRY_NOT_FUTURE },
      },
    };
  }
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

  try {
    const granted = await queries.tenantEntitlementGrants.grantEntitlement({
      tenantId,
      item,
      grantedBy: admin.id,
      expiresAt,
      note,
    });

    if (!granted.ok) {
      if (granted.error === ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED) {
        return {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: ENTITLEMENT_GRANT_REFUSAL.ALREADY_GRANTED,
        };
      }
      throw new Error(granted.error);
    }

    const { id, kind, key, value } = granted.data;
    await revalidateSiteConfig(tenantId);
    await recordAuditEvent({
      logEvent: ENTITLEMENT_GRANT_LOG.GRANT_AUDIT_FAILED,
      action: AUDIT_ACTION.ENTITLEMENT_GRANTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: { grantId: id, kind, key, value, expiresAt, note },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(ENTITLEMENT_GRANT_LOG.GRANT_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
