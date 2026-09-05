'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { validateEmailLogoUpload } from '@platform/server/email/validate-email-logo';
import { buildEmailLogoBlobPath } from '@platform/utils/email-logo-blob-path/email-logo-blob-path';
import {
  emailLogoTargetSchema,
  type TEmailLogoTarget,
} from '@platform/utils/email-logo-target/email-logo-target';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { del, put } from '@vercel/blob';

export type TUploadEmailLogoResult =
  { ok: true; url: string } | { ok: false; error: string };

const getPreviousLogoUrl = async (
  tenantId: string,
  target: TEmailLogoTarget,
): Promise<string | undefined> => {
  if (target.type === 'tenant') {
    const config = await queries.emailConfig.getEmailConfig(tenantId);
    return config?.logoAssetUrl;
  }

  const template = await queries.emailTemplates.getEmailTemplate(
    tenantId,
    target.templateType,
  );
  return template.logoAssetUrl;
};

const persistLogoUrl = async (
  tenantId: string,
  target: TEmailLogoTarget,
  url: string | null,
): Promise<void> => {
  if (target.type === 'tenant') {
    await queries.emailConfig.upsertEmailConfig(tenantId, {
      logoAssetUrl: url,
    });
    return;
  }

  await queries.emailTemplates.upsertEmailTemplate(
    tenantId,
    target.templateType,
    {
      logoAssetUrl: url,
    },
  );
};

/**
 * Uploads and persists the tenant's own email logo, or one template's own
 * logo, resolved by `target`. Reuses the site logo's
 * upload transport (`FormData` with a `File`, `put()` to Vercel Blob with
 * `access: 'public'` — recipients fetch this with no session) but never its
 * validator: `validateEmailLogoUpload` enforces email-specific limits.
 * `requireTenantMembership` re-checks the session against `tenantId` here
 * too, and `target` is re-validated even though the client only ever sends
 * a value its own types allow.
 */
export const uploadEmailLogoAction = async (
  tenantId: string,
  target: TEmailLogoTarget,
  formData: FormData,
): Promise<TUploadEmailLogoResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedTarget = emailLogoTargetSchema.safeParse(target);
  if (!parsedTarget.success) {
    return { ok: false, error: 'Unrecognized upload target.' };
  }

  if (!env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error: 'File uploads are not configured for this environment yet.',
    };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: 'Choose a file to upload.' };
  }

  const validation = await validateEmailLogoUpload(file);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const { buffer, contentType, extension } = validation.asset;
  const pathname = buildEmailLogoBlobPath(
    tenant.id,
    parsedTarget.data,
    extension,
  );

  try {
    const previousUrl = await getPreviousLogoUrl(tenant.id, parsedTarget.data);

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      token: env.BLOB_READ_WRITE_TOKEN,
    });

    await persistLogoUrl(tenant.id, parsedTarget.data, blob.url);

    if (previousUrl && previousUrl !== blob.url) {
      try {
        await del(previousUrl, { token: env.BLOB_READ_WRITE_TOKEN });
      } catch (error) {
        logger.error('email_logo.delete_failed', {
          tenantId: tenant.id,
          target: parsedTarget.data,
          error,
        });
      }
    }

    await recordAuditEvent({
      logEvent: 'email_logo.upload_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: {
        target: parsedTarget.data,
        operation: 'upload',
        url: blob.url,
      },
    });

    return { ok: true, url: blob.url };
  } catch (error) {
    logger.error('email_logo.upload_failed', {
      tenantId: tenant.id,
      target: parsedTarget.data,
      error,
    });
    return { ok: false, error: "Couldn't upload the logo — try again." };
  }
};
