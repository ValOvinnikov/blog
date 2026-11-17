'use server';

import {
  ANALYTICS_FIELD_ERROR,
  SETTINGS_FEATURES_LOG,
  type TAnalyticsFieldErrorReason,
} from '@platform/constants/settings-features';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { blankToNull } from '@platform/utils/blank-to-null/blank-to-null';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  toNotInPlanRefusal,
  type TNotInPlanRefusal,
} from '@platform/utils/plan-refusal/plan-refusal';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@shinefold/config';
import { ANALYTICS_PROVIDER } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { isNull } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { z } from 'zod';

const updateAnalyticsInputSchema = z.object({
  analyticsProvider: z.enum(ANALYTICS_PROVIDER),
  analyticsId: z.string(),
});

export type TUpdateAnalyticsInput = z.input<typeof updateAnalyticsInputSchema>;
export type TUpdateAnalyticsResult =
  | TActionResult<
      typeof ACTION_OUTCOME.SERVER_ERROR,
      'analyticsId',
      TAnalyticsFieldErrorReason
    >
  | TNotInPlanRefusal;

const writeAnalytics = (tenantId: string, input: TUpdateAnalyticsInput) => {
  const analyticsId = blankToNull(input.analyticsId);
  if (isNull(analyticsId)) {
    return queries.tenantAnalytics.clearTenantAnalytics(tenantId);
  }
  return queries.tenantAnalytics.saveTenantAnalytics(tenantId, {
    provider: input.analyticsProvider,
    analyticsId,
  });
};

/** A blank id clears the stored one; setting an id needs the plan's own-analytics entitlement, while clearing never does. */
export const updateAnalyticsAction = async (
  tenantId: string,
  input: TUpdateAnalyticsInput,
): Promise<TUpdateAnalyticsResult> => {
  const parsed = updateAnalyticsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantManager(tenantId);
  const { analyticsProvider, analyticsId } = parsed.data;
  const isClearing = isNull(blankToNull(analyticsId));

  if (!isClearing && !tenant.entitlements.hasOwnAnalytics) {
    logger.warn(SETTINGS_FEATURES_LOG.PLAN_ENTITLEMENT_REJECTED, {
      tenantId: tenant.id,
      plan: tenant.plan,
      fields: ['analyticsId'],
    });
    return toNotInPlanRefusal(tenant.plan, ['analyticsId']);
  }

  const isValid =
    isClearing ||
    queries.tenantAnalytics.saveTenantAnalyticsInputSchema.safeParse({
      provider: analyticsProvider,
      analyticsId,
    }).success;
  if (!isValid) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        analyticsId: { reason: ANALYTICS_FIELD_ERROR.ID_INVALID },
      },
    };
  }

  try {
    await writeAnalytics(tenant.id, parsed.data);
    await revalidateSiteConfig(tenant.id);
    await recordAuditEvent({
      logEvent: SETTINGS_FEATURES_LOG.ANALYTICS_UPDATE_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
      targetId: tenant.id,
      details: { analyticsProvider, isCleared: isClearing },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SETTINGS_FEATURES_LOG.ANALYTICS_UPDATE_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
