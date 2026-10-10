'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { deleteBlobBestEffort } from '@platform/server/blob/delete-blob-best-effort';
import { readUploadedFile } from '@platform/server/blob/read-uploaded-file';
import { UNRECOGNIZED_UPLOAD_TARGET_RESULT } from '@platform/server/blob/unrecognized-upload-target';
import {
  getBrandAssetUrl,
  setBrandAssetUrl,
} from '@platform/server/site-config/brand-asset-store';
import { validateBrandAssetUpload } from '@platform/server/site-config/validate-brand-asset';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { logger } from '@platform/utils/logger/logger';
import { put } from '@vercel/blob';

export type TUploadBrandAssetResult =
  { ok: true; url: string } | { ok: false; error: string };

// `kind` is re-validated although the client only sends one of two literals: a Server Action is a public endpoint.
export const uploadBrandAssetAction = async (
  tenantId: string,
  kind: TBrandAssetKind,
  formData: FormData,
): Promise<TUploadBrandAssetResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedKind = brandAssetKindSchema.safeParse(kind);
  if (!parsedKind.success) return UNRECOGNIZED_UPLOAD_TARGET_RESULT;
  const targetKind = parsedKind.data;

  const upload = readUploadedFile(formData);
  if (!upload.ok) return upload;
  const { file, token } = upload;

  const validation = await validateBrandAssetUpload(file, targetKind);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const { buffer, contentType, extension } = validation.asset;
  const pathname = `tenants/${tenant.id}/${targetKind}.${extension}`;

  try {
    const previousUrl = await getBrandAssetUrl(tenant.id, targetKind);

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      token,
    });

    await setBrandAssetUrl(tenant.id, targetKind, blob.url);

    if (previousUrl && previousUrl !== blob.url) {
      await deleteBlobBestEffort(
        previousUrl,
        'site_config.brand_asset_delete_failed',
        { tenantId: tenant.id, kind: targetKind },
      );
    }

    await recordAuditEvent({
      logEvent: 'site_config.brand_asset_upload_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { asset: targetKind, operation: 'upload', url: blob.url },
    });

    return { ok: true, url: blob.url };
  } catch (error) {
    logger.error('site_config.brand_asset_upload_failed', {
      tenantId: tenant.id,
      kind: targetKind,
      error,
    });
    return {
      ok: false,
      error: `Couldn't upload the ${targetKind} — try again.`,
    };
  }
};
