'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { deleteBlobBestEffort } from '@platform/server/blob/delete-blob-best-effort';
import { UNRECOGNIZED_UPLOAD_TARGET_RESULT } from '@platform/server/blob/unrecognized-upload-target';
import {
  getEmailLogoUrl,
  setEmailLogoUrl,
} from '@platform/server/email/email-logo-store';
import {
  emailLogoTargetSchema,
  type TEmailLogoTarget,
} from '@platform/utils/email-logo-target/email-logo-target';
import { logger } from '@platform/utils/logger/logger';

export type TClearEmailLogoResult = { ok: true } | { ok: false; error: string };

export const clearEmailLogoAction = async (
  tenantId: string,
  target: TEmailLogoTarget,
): Promise<TClearEmailLogoResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedTarget = emailLogoTargetSchema.safeParse(target);
  if (!parsedTarget.success) return UNRECOGNIZED_UPLOAD_TARGET_RESULT;
  const logoTarget = parsedTarget.data;

  try {
    const previousUrl = await getEmailLogoUrl(tenant.id, logoTarget);
    if (!previousUrl) return { ok: true };

    await setEmailLogoUrl(tenant.id, logoTarget, null);

    await deleteBlobBestEffort(previousUrl, 'email_logo.delete_failed', {
      tenantId: tenant.id,
      target: logoTarget,
    });

    await recordAuditEvent({
      logEvent: 'email_logo.clear_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { target: logoTarget, operation: 'clear' },
    });

    return { ok: true };
  } catch (error) {
    logger.error('email_logo.clear_failed', {
      tenantId: tenant.id,
      target: logoTarget,
      error,
    });
    return { ok: false, error: "Couldn't remove the logo — try again." };
  }
};
