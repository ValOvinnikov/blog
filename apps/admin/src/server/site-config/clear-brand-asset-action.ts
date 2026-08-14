'use server';

import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
import { getSiteConfigOrDefaults } from '@admin/server/site-config/site-config-or-defaults';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@admin/utils/brand-asset-limits/brand-asset-limits';
import { env } from '@admin/utils/env/env';
import { sanitizeLogMessage } from '@admin/utils/sanitize-log-message/sanitize-log-message';
import { queries } from '@blog/db';
import { del } from '@vercel/blob';

export type TClearBrandAssetResult =
  { ok: true } | { ok: false; error: string };

/**
 * Returns `logoAssetUrl`/`faviconAssetUrl` to `NULL` — the site falls back
 * to its default asset the same way it did before anything was ever
 * uploaded. Idempotent: clearing an already-empty field is a no-op success,
 * not an error, so a stale "Remove" click can't fail.
 */
export async function clearBrandAssetAction(
  tenantSlug: string,
  kind: TBrandAssetKind,
): Promise<TClearBrandAssetResult> {
  const { tenant } = await requireTenantMembership(tenantSlug);

  const parsedKind = brandAssetKindSchema.safeParse(kind);
  if (!parsedKind.success) {
    return { ok: false, error: 'Unrecognized upload target.' };
  }
  const targetKind = parsedKind.data;

  try {
    const current = await getSiteConfigOrDefaults(tenant.id);
    const previousUrl =
      targetKind === 'logo' ? current.logoAssetUrl : current.faviconAssetUrl;

    if (!previousUrl) return { ok: true };

    const assetUpdate =
      targetKind === 'logo'
        ? { logoAssetUrl: null }
        : { faviconAssetUrl: null };

    await queries.siteConfig.upsertSiteConfig(tenant.id, {
      preset: current.preset,
      accentHue: current.accentHue,
      headingFont: current.headingFont,
      bodyFont: current.bodyFont,
      radiusScale: current.radiusScale,
      density: current.density,
      ...assetUpdate,
    });

    if (env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(previousUrl, { token: env.BLOB_READ_WRITE_TOKEN });
      } catch (error) {
        console.error(
          `Failed to delete previous ${targetKind} asset:`,
          sanitizeLogMessage(error),
        );
      }
    }

    return { ok: true };
  } catch (error) {
    console.error(
      `Failed to clear ${targetKind} asset:`,
      sanitizeLogMessage(error),
    );
    return {
      ok: false,
      error: `Couldn't remove the ${targetKind} — try again.`,
    };
  }
}
