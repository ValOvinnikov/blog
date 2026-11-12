'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { isUndefined } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  NEWSLETTER_PAUSE_LOG,
  NEWSLETTER_PAUSE_REFUSAL,
} from '@platform/constants/newsletter-pause';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const tenantIdSchema = z.uuid();

export type TClearNewsletterPauseResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'tenantId',
  never,
  typeof NEWSLETTER_PAUSE_REFUSAL.NOT_PAUSED
>;

export const clearNewsletterPauseAction = async (
  tenantId: string,
): Promise<TClearNewsletterPauseResult> => {
  const parsed = tenantIdSchema.safeParse(tenantId);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantById(parsed.data);

  try {
    const pausedAt = await queries.emailConfig.getNewsletterPausedAt(tenant.id);
    if (isUndefined(pausedAt)) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: NEWSLETTER_PAUSE_REFUSAL.NOT_PAUSED,
      };
    }

    await queries.emailConfig.clearNewsletterPause(tenant.id);

    await recordAuditEvent({
      logEvent: NEWSLETTER_PAUSE_LOG.CLEAR_AUDIT_FAILED,
      action: AUDIT_ACTION.NEWSLETTER_PAUSE_CLEARED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenant.id,
      details: { name: tenant.name, pausedAt: pausedAt.toISOString() },
    });
  } catch (error) {
    logger.error(NEWSLETTER_PAUSE_LOG.CLEAR_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
