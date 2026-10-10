'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { deleteBlobBestEffort } from '@platform/server/blob/delete-blob-best-effort';
import { UNRECOGNIZED_UPLOAD_TARGET_RESULT } from '@platform/server/blob/unrecognized-upload-target';
import {
  getBrandAssetUrl,
  setBrandAssetUrl,
} from '@platform/server/site-config/brand-asset-store';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { logger } from '@platform/utils/logger/logger';

export type TClearBrandAssetResult =
  { ok: true } | { ok: false; error: string };

export const clearBrandAssetAction = async (
  tenantId: string,
  kind: TBrandAssetKind,
): Promise<TClearBrandAssetResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedKind = brandAssetKindSchema.safeParse(kind);
  if (!parsedKind.success) return UNRECOGNIZED_UPLOAD_TARGET_RESULT;
  const targetKind = parsedKind.data;

  try {
    const previousUrl = await getBrandAssetUrl(tenant.id, targetKind);
    if (!previousUrl) return { ok: true };

    await setBrandAssetUrl(tenant.id, targetKind, null);

    await deleteBlobBestEffort(
      previousUrl,
      'site_config.brand_asset_delete_failed',
      { tenantId: tenant.id, kind: targetKind },
    );

    await recordAuditEvent({
      logEvent: 'site_config.brand_asset_clear_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { asset: targetKind, operation: 'clear' },
    });

    return { ok: true };
  } catch (error) {
    logger.error('site_config.brand_asset_clear_failed', {
      tenantId: tenant.id,
      kind: targetKind,
      error,
    });
    return {
      ok: false,
      error: `Couldn't remove the ${targetKind} — try again.`,
    };
  }
};
