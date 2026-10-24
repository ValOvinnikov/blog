'use server';

import { ACTION_OUTCOME, AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { EMAIL_LOGO_LOG } from '@platform/constants/email-logo';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { deleteBlobBestEffort } from '@platform/server/blob/delete-blob-best-effort';
import { readUploadedFile } from '@platform/server/blob/read-uploaded-file';
import { UNRECOGNIZED_UPLOAD_TARGET_RESULT } from '@platform/server/blob/unrecognized-upload-target';
import {
  getEmailLogoUrl,
  setEmailLogoUrl,
} from '@platform/server/email/email-logo-store';
import { validateEmailLogoUpload } from '@platform/server/email/validate-email-logo';
import type { TUploadResult } from '@platform/server/uploads/upload-error';
import { buildEmailLogoBlobPath } from '@platform/utils/email-logo-blob-path/email-logo-blob-path';
import {
  emailLogoTargetSchema,
  type TEmailLogoTarget,
} from '@platform/utils/email-logo-target/email-logo-target';
import { logger } from '@platform/utils/logger/logger';
import { put } from '@vercel/blob';

export const uploadEmailLogoAction = async (
  tenantId: string,
  target: TEmailLogoTarget,
  formData: FormData,
): Promise<TUploadResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedTarget = emailLogoTargetSchema.safeParse(target);
  if (!parsedTarget.success) return UNRECOGNIZED_UPLOAD_TARGET_RESULT;
  const logoTarget = parsedTarget.data;

  const upload = readUploadedFile(formData);
  if (!upload.ok) return upload.error;
  const { file, token } = upload.data;

  const validation = await validateEmailLogoUpload(file);
  if (!validation.ok) {
    return validation.error;
  }

  const { buffer, contentType, extension } = validation.data;
  const pathname = buildEmailLogoBlobPath(tenant.id, logoTarget, extension);

  try {
    const previousUrl = await getEmailLogoUrl(tenant.id, logoTarget);

    const blob = await put(pathname, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
      token,
    });

    await setEmailLogoUrl(tenant.id, logoTarget, blob.url);

    if (previousUrl && previousUrl !== blob.url) {
      await deleteBlobBestEffort(previousUrl, EMAIL_LOGO_LOG.DELETE_FAILED, {
        tenantId: tenant.id,
        target: logoTarget,
      });
    }

    await recordAuditEvent({
      logEvent: EMAIL_LOGO_LOG.UPLOAD_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { target: logoTarget, operation: 'upload', url: blob.url },
    });

    return { outcome: ACTION_OUTCOME.SUCCESS, url: blob.url };
  } catch (error) {
    logger.error(EMAIL_LOGO_LOG.UPLOAD_FAILED, {
      tenantId: tenant.id,
      target: logoTarget,
      error,
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
