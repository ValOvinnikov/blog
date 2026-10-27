'use server';

import { ACTION_OUTCOME, AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { deleteBlobBestEffort } from '@platform/server/blob/delete-blob-best-effort';
import { UNRECOGNIZED_UPLOAD_TARGET_RESULT } from '@platform/server/blob/unrecognized-upload-target';
import {
  getBrandAssetUrl,
  setBrandAssetUrl,
} from '@platform/server/site-config/brand-asset-store';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import type { TClearUploadResult } from '@platform/server/uploads/upload-error';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

export const clearBrandAssetAction = async (
  tenantId: string,
  kind: TBrandAssetKind,
): Promise<TClearUploadResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedKind = brandAssetKindSchema.safeParse(kind);
  if (!parsedKind.success) return UNRECOGNIZED_UPLOAD_TARGET_RESULT;
  const targetKind = parsedKind.data;

  try {
    const previousUrl = await getBrandAssetUrl(tenant.id, targetKind);
    if (!previousUrl) return toOutcome(ACTION_OUTCOME.SUCCESS);

    await setBrandAssetUrl(tenant.id, targetKind, null);
    await revalidateSiteConfig(tenant.id);

    await deleteBlobBestEffort(
      previousUrl,
      SITE_CONFIG_LOG.BRAND_ASSET_DELETE_FAILED,
      { tenantId: tenant.id, kind: targetKind },
    );

    await recordAuditEvent({
      logEvent: SITE_CONFIG_LOG.BRAND_ASSET_CLEAR_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { asset: targetKind, operation: 'clear' },
    });

    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SITE_CONFIG_LOG.BRAND_ASSET_CLEAR_FAILED, {
      tenantId: tenant.id,
      kind: targetKind,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
