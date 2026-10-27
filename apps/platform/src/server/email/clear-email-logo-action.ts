'use server';

import { ACTION_OUTCOME, AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { EMAIL_LOGO_LOG } from '@platform/constants/email-logo';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { deleteBlobBestEffort } from '@platform/server/blob/delete-blob-best-effort';
import { UNRECOGNIZED_UPLOAD_TARGET_RESULT } from '@platform/server/blob/unrecognized-upload-target';
import {
  getEmailLogoUrl,
  setEmailLogoUrl,
} from '@platform/server/email/email-logo-store';
import type { TClearUploadResult } from '@platform/server/uploads/upload-error';
import {
  emailLogoTargetSchema,
  type TEmailLogoTarget,
} from '@platform/utils/email-logo-target/email-logo-target';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

export const clearEmailLogoAction = async (
  tenantId: string,
  target: TEmailLogoTarget,
): Promise<TClearUploadResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedTarget = emailLogoTargetSchema.safeParse(target);
  if (!parsedTarget.success) return UNRECOGNIZED_UPLOAD_TARGET_RESULT;
  const logoTarget = parsedTarget.data;

  try {
    const previousUrl = await getEmailLogoUrl(tenant.id, logoTarget);
    if (!previousUrl) return toOutcome(ACTION_OUTCOME.SUCCESS);

    await setEmailLogoUrl(tenant.id, logoTarget, null);

    await deleteBlobBestEffort(previousUrl, EMAIL_LOGO_LOG.DELETE_FAILED, {
      tenantId: tenant.id,
      target: logoTarget,
    });

    await recordAuditEvent({
      logEvent: EMAIL_LOGO_LOG.CLEAR_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { target: logoTarget, operation: 'clear' },
    });

    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(EMAIL_LOGO_LOG.CLEAR_FAILED, {
      tenantId: tenant.id,
      target: logoTarget,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
