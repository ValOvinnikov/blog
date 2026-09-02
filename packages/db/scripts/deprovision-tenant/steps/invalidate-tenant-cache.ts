import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

const REVALIDATE_PATH = '/api/revalidate-site-config';

/**
 * Step 6 — purges the now-archived tenant's cached pages by POSTing to
 * `apps/web`'s on-demand revalidation endpoint, so the site stops serving
 * from the prerender cache instead of waiting out its fallback window.
 * Must run after `archive-tenant`: invalidating while the tenant is still
 * ACTIVE would let a page re-cache before the archive takes effect.
 */
export async function invalidateTenantCache(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  if (env.dryRun) {
    console.warn(
      `[dry-run] would invalidate cached pages for tenant "${tenant.id}".`,
    );
    return;
  }

  if (!env.webAppUrl || !env.siteConfigRevalidateSecret) {
    throw new Error(
      `invalidate-tenant-cache: missing WEB_APP_URL or SITE_CONFIG_REVALIDATE_SECRET — cannot invalidate cached pages for archived tenant "${tenant.id}".`,
    );
  }

  const response = await fetch(new URL(REVALIDATE_PATH, env.webAppUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.siteConfigRevalidateSecret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tenantId: tenant.id }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `invalidate-tenant-cache: revalidation request failed for tenant "${tenant.id}": ${response.status} ${body}`,
    );
  }
}
