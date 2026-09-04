import { queries } from '@blog/db';
import { isSecretMatch } from '@blog/utils';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import {
  buildSettingsFeaturesCacheTag,
  buildSiteConfigCacheTag,
  buildTenantPlanCacheTag,
} from '@web/utils/tenant-cache-tags';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// `revalidateTag` requires the Node.js runtime (it isn't supported on Edge).
export const runtime = 'nodejs';

const buildTagsForTenant = (tenantId: string): string[] => [
  buildSiteConfigCacheTag(tenantId),
  buildSettingsFeaturesCacheTag(tenantId),
  buildTenantPlanCacheTag(tenantId),
];

const parseTenantId = async (request: Request): Promise<string | undefined> => {
  try {
    const body: unknown = await request.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'tenantId' in body &&
      typeof (body as { tenantId: unknown }).tenantId === 'string' &&
      (body as { tenantId: string }).tenantId.length > 0
    ) {
      return (body as { tenantId: string }).tenantId;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

/**
 * Resolves the tenant ids to revalidate: just the given one, or — for a
 * caller that hasn't been updated to send one yet — every tenant, so an
 * omitted `tenantId` still revalidates rather than silently doing nothing.
 */
const resolveTenantIdsToRevalidate = async (
  requestedTenantId: string | undefined,
): Promise<string[]> => {
  if (requestedTenantId) return [requestedTenantId];

  const tenants = await queries.tenants.listTenants();
  return tenants.map((tenant) => tenant.id);
};

/**
 * On-demand revalidation endpoint for `apps/platform`'s Look/Voice/Features
 * saves — `@blog/db` writes there directly, with no wiring into this app's
 * cache, so without this call a save can take up to an hour to appear live
 * (see `@web/server/site-config/get-site-config`,
 * `@web/server/settings-features/get-effective-settings-features`,
 * `@web/server/tenant/get-tenant-plan`). Verified with a plain shared secret
 * (`Authorization: Bearer <SITE_CONFIG_REVALIDATE_SECRET>`), not a signed
 * payload — this is a trusted internal service-to-service call between the
 * two apps, not a public webhook. Accepts an optional JSON body
 * `{ tenantId }` to scope revalidation to the tenant that actually saved;
 * an empty/missing body revalidates every tenant.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.SITE_CONFIG_REVALIDATE_SECRET;
  if (!secret) {
    logger.error('revalidate_site_config.secret_missing');
    return NextResponse.json(
      { message: 'Revalidation secret is not configured.' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!isSecretMatch(providedSecret, secret)) {
    return NextResponse.json(
      { message: 'Invalid or missing secret.' },
      { status: 401 },
    );
  }

  const requestedTenantId = await parseTenantId(request);
  const tenantIds = await resolveTenantIdsToRevalidate(requestedTenantId);
  const revalidatedTags = tenantIds.flatMap(buildTagsForTenant);

  for (const tag of revalidatedTags) {
    revalidateTag(tag, { expire: 0 });
  }
  // Tag expiry alone does not invalidate prerendered route entries on
  // Vercel, so this purges the whole site regardless of `tenantId`, same as
  // `/api/revalidate`. Per-tenant scoping isn't expressible here: Next
  // derives each route's implicit layout tags from the route pattern with
  // dynamic segments unresolved, never from a resolved value, so a path
  // built from a specific tenant id matches nothing. Purging each resolved
  // tenant path individually would work and is tracked separately.
  revalidatePath('/', 'layout');

  return NextResponse.json(
    { revalidated: revalidatedTags, pathPurged: true },
    { status: 200 },
  );
}
