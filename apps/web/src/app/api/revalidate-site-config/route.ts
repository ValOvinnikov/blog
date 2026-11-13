import { HTTP_STATUS, type TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { isSecretMatch } from '@blog/utils';
import { hasLength, isNull, isString } from '@blog/utils/primitives';
import { REVALIDATE_SITE_CONFIG_LOG } from '@web/constants/revalidate-site-config';
import { purgeDerivedPaths } from '@web/server/revalidate/purge-derived-paths/purge-derived-paths';
import { resolveTenantSitePaths } from '@web/server/revalidate/resolve-tenant-site-paths/resolve-tenant-site-paths';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import {
  buildSettingsFeaturesCacheTag,
  buildSiteConfigCacheTag,
  buildTenantPlanCacheTag,
  TENANT_BY_HOST_CACHE_TAG,
} from '@web/utils/tenant-cache-tags';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// `revalidateTag` requires the Node.js runtime (it isn't supported on Edge).
export const runtime = 'nodejs';

const buildTagsForTenant = (tenantId: string): string[] => [
  buildSiteConfigCacheTag(tenantId),
  buildSettingsFeaturesCacheTag(tenantId),
  buildTenantPlanCacheTag(tenantId),
];

const parseTenantId = async (
  request: Request,
): Promise<TMaybeUndefined<string>> => {
  try {
    const body: unknown = await request.json();
    if (typeof body !== 'object' || isNull(body)) {
      return undefined;
    }
    const tenantId = (body as Record<string, unknown>)['tenantId'];
    return isString(tenantId) && hasLength(tenantId) ? tenantId : undefined;
  } catch {
    return undefined;
  }
};

const resolveTenantIdsToRevalidate = async (
  requestedTenantId: TMaybeUndefined<string>,
): Promise<string[]> => {
  if (requestedTenantId) return [requestedTenantId];

  const tenants = await queries.tenants.listTenants();
  return tenants.map((tenant) => tenant.id);
};

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.SITE_CONFIG_REVALIDATE_SECRET;
  if (!secret) {
    logger.error(REVALIDATE_SITE_CONFIG_LOG.SECRET_MISSING);
    return NextResponse.json(
      { message: 'Revalidation secret is not configured.' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }

  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!isSecretMatch(providedSecret, secret)) {
    return NextResponse.json(
      { message: 'Invalid or missing secret.' },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  const requestedTenantId = await parseTenantId(request);
  const tenantIds = await resolveTenantIdsToRevalidate(requestedTenantId);
  const revalidatedTags = [
    ...tenantIds.flatMap(buildTagsForTenant),
    TENANT_BY_HOST_CACHE_TAG,
  ];

  for (const tag of revalidatedTags) {
    revalidateTag(tag, { expire: 0 });
  }

  purgeDerivedPaths(await resolveTenantSitePaths(requestedTenantId), {
    tenantId: requestedTenantId,
  });

  return NextResponse.json(
    { revalidated: revalidatedTags, pathPurged: true },
    { status: HTTP_STATUS.OK },
  );
}
