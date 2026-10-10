'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
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
import { buildEmailLogoBlobPath } from '@platform/utils/email-logo-blob-path/email-logo-blob-path';
import {
  emailLogoTargetSchema,
  type TEmailLogoTarget,
} from '@platform/utils/email-logo-target/email-logo-target';
import { logger } from '@platform/utils/logger/logger';
import { put } from '@vercel/blob';

export type TUploadEmailLogoResult =
  { ok: true; url: string } | { ok: false; error: string };

export const uploadEmailLogoAction = async (
  tenantId: string,
  target: TEmailLogoTarget,
  formData: FormData,
): Promise<TUploadEmailLogoResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedTarget = emailLogoTargetSchema.safeParse(target);
  if (!parsedTarget.success) return UNRECOGNIZED_UPLOAD_TARGET_RESULT;
  const logoTarget = parsedTarget.data;

  const upload = readUploadedFile(formData);
  if (!upload.ok) return upload;
  const { file, token } = upload;

  const validation = await validateEmailLogoUpload(file);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const { buffer, contentType, extension } = validation.asset;
  const pathname = buildEmailLogoBlobPath(tenant.id, logoTarget, extension);

  try {
    const previousUrl = await getEmailLogoUrl(tenant.id, logoTarget);

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      token,
    });

    await setEmailLogoUrl(tenant.id, logoTarget, blob.url);

    if (previousUrl && previousUrl !== blob.url) {
      await deleteBlobBestEffort(previousUrl, 'email_logo.delete_failed', {
        tenantId: tenant.id,
        target: logoTarget,
      });
    }

    await recordAuditEvent({
      logEvent: 'email_logo.upload_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { target: logoTarget, operation: 'upload', url: blob.url },
    });

    return { ok: true, url: blob.url };
  } catch (error) {
    logger.error('email_logo.upload_failed', {
      tenantId: tenant.id,
      target: logoTarget,
      error,
    });
    return { ok: false, error: "Couldn't upload the logo — try again." };
  }
};
