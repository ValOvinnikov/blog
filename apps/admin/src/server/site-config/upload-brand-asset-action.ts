'use server';

import { recordAuditEvent } from '@admin/server/audit/record-audit-event';
import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
import { getSiteConfigOrDefaults } from '@admin/server/site-config/site-config-or-defaults';
import { validateBrandAssetUpload } from '@admin/server/site-config/validate-brand-asset';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@admin/utils/brand-asset-limits/brand-asset-limits';
import { env } from '@admin/utils/env/env';
import { logger } from '@admin/utils/logger/logger';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { del, put } from '@vercel/blob';

export type TUploadBrandAssetResult =
  { ok: true; url: string } | { ok: false; error: string };

/**
 * Called directly from `BrandAssetField` on file selection — persists to
 * `site_config` immediately, not gated behind the Look tab's "Save changes"
 * (the same way any native file-upload control takes effect right away).
 * `requireTenantMembership` re-checks the session against `tenantSlug` here
 * too, same as every other Look-tab action; `kind` is re-validated even
 * though the client only ever sends one of two literals, since a Server
 * Action is a public HTTP endpoint regardless of what its caller's types say.
 */
export async function uploadBrandAssetAction(
  tenantSlug: string,
  kind: TBrandAssetKind,
  formData: FormData,
): Promise<TUploadBrandAssetResult> {
  const { tenant } = await requireTenantMembership(tenantSlug);

  const parsedKind = brandAssetKindSchema.safeParse(kind);
  if (!parsedKind.success) {
    return { ok: false, error: 'Unrecognized upload target.' };
  }
  const targetKind = parsedKind.data;

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

  const validation = await validateBrandAssetUpload(file, targetKind);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const { buffer, contentType, extension } = validation.asset;
  const pathname = `tenants/${tenant.id}/${targetKind}.${extension}`;

  try {
    const current = await getSiteConfigOrDefaults(tenant.id);
    const previousUrl =
      targetKind === 'logo' ? current.logoAssetUrl : current.faviconAssetUrl;

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      token: env.BLOB_READ_WRITE_TOKEN,
    });

    const assetUpdate =
      targetKind === 'logo'
        ? { logoAssetUrl: blob.url }
        : { faviconAssetUrl: blob.url };

    await queries.siteConfig.upsertSiteConfig(tenant.id, {
      preset: current.preset,
      accentHue: current.accentHue,
      headingFont: current.headingFont,
      bodyFont: current.bodyFont,
      radiusScale: current.radiusScale,
      density: current.density,
      ...assetUpdate,
    });

    if (previousUrl && previousUrl !== blob.url) {
      try {
        await del(previousUrl, { token: env.BLOB_READ_WRITE_TOKEN });
      } catch (error) {
        logger.error('site_config.brand_asset_delete_failed', {
          tenantId: tenant.id,
          kind: targetKind,
          error,
        });
      }
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
}
