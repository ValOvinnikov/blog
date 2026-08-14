'use server';

import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
import type { TVoiceOverrides } from '@admin/utils/voice-fields/voice-fields';
import { PRESET_ID, PRESET_REGISTRY } from '@blog/config/constants';
import { queries } from '@blog/db';

export type TSaveVoiceOverridesResult = { ok: true } | { ok: false };

/**
 * Persists the Voice tab's 20 curated overrides for the routed tenant.
 * Re-derives the tenant and re-checks membership from the session itself
 * via `requireTenantMembership` — never trusts a client-supplied tenant id.
 * Shared by both `/t/[tenantSlug]/voice` and the slug-free `/dashboard/voice`
 * (via `VoicePageContent`): `requireTenantMembership` takes a slug either
 * way, and the dashboard route already resolved its tenant's real slug from
 * the session's own `memberships`, so re-checking it here is a no-op
 * re-verification rather than a second code path.
 *
 * `upsertSiteConfig` writes its typed theme columns on every call (they're
 * required, not optional), so a Voice-only save must round-trip the
 * tenant's existing theme values unchanged rather than omit them, or it
 * would silently reset whatever the Look tab last saved. A tenant with no
 * `site_config` row yet (Look never saved) falls back to the CONSOLE
 * preset's own registry defaults.
 */
export async function saveVoiceOverridesAction(
  tenantSlug: string,
  overrides: TVoiceOverrides,
): Promise<TSaveVoiceOverridesResult> {
  const { tenant } = await requireTenantMembership(tenantSlug);

  const existing = await queries.siteConfig.getSiteConfig(tenant.id);
  const theme = existing ?? PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

  try {
    await queries.siteConfig.upsertSiteConfig(tenant.id, {
      preset: existing?.preset ?? PRESET_ID.CONSOLE,
      accentHue: theme.accentHue,
      logoHue: existing?.logoHue,
      headingFont: theme.headingFont,
      bodyFont: theme.bodyFont,
      radiusScale: theme.radiusScale,
      density: theme.density,
      logoAssetUrl: existing?.logoAssetUrl,
      faviconAssetUrl: existing?.faviconAssetUrl,
      voiceOverrides: overrides,
    });

    return { ok: true };
  } catch (error) {
    console.error(
      `Failed to save voice overrides for tenant "${tenantSlug}":`,
      error,
    );
    return { ok: false };
  }
}
