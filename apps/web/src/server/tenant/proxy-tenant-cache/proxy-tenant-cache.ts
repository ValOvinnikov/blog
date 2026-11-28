import type {
  TMaybeJsonDates,
  TMaybeNull,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { sha256Hex } from '@shinefold/utils/hash';
import { isNull } from '@shinefold/utils/primitives';
import { getCache } from '@vercel/functions';
import { PROXY_LOG } from '@web/constants/proxy';
import { ONE_HOUR_IN_SECONDS } from '@web/constants/time';
import type { TResolvedHost } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { reviveCachedTenant } from '@web/server/tenant/revive-cached-tenant/revive-cached-tenant';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { buildProxyTenantCacheTag } from '@web/utils/tenant-cache-tags';
import { chunk } from 'remeda';

type TCachedHost = {
  host: string;
  tenant: TMaybeJsonDates<TTenant>;
  isOwnHost: boolean;
};

const EXPIRE_TAG_BATCH_SIZE = 100;

const LOCAL_NAMESPACE = 'local';

// Vercel can share one Runtime Cache across a team's projects, and `VERCEL_ENV` reads `production` on both web projects.
const getNamespace = (): string => env.VERCEL_PROJECT_ID ?? LOCAL_NAMESPACE;

// The default key hash is 32-bit, so a crafted hostname could share another site's entry.
const getProxyTenantCache = () =>
  getCache({ namespace: getNamespace(), keyHashFunction: sha256Hex });

const readCachedHost = async (
  host: string,
): Promise<TMaybeUndefined<TResolvedHost>> => {
  try {
    const cached = (await getProxyTenantCache().get(
      host,
    )) as TMaybeNull<TCachedHost>;
    if (cached?.host !== host) return undefined;

    const { tenant, isOwnHost } = cached;
    return { tenant: reviveCachedTenant(tenant), isOwnHost };
  } catch (error) {
    logger.warn(PROXY_LOG.TENANT_CACHE_READ_FAILED, { host, error });
    return undefined;
  }
};

const writeCachedHost = async (
  host: string,
  resolved: TResolvedHost,
): Promise<void> => {
  try {
    const entry: TCachedHost = { host, ...resolved };
    await getProxyTenantCache().set(host, entry, {
      tags: [buildProxyTenantCacheTag(getNamespace(), resolved.tenant.id)],
      ttl: ONE_HOUR_IN_SECONDS,
    });
  } catch (error) {
    logger.warn(PROXY_LOG.TENANT_CACHE_WRITE_FAILED, { host, error });
  }
};

// A miss is never stored, so a host visited before its tenant is servable resolves the moment it is.
export const readThroughProxyTenantCache = async (
  host: TMaybeNull<string>,
  resolve: (
    host: TMaybeNull<string>,
  ) => Promise<TMaybeUndefined<TResolvedHost>>,
): Promise<TMaybeUndefined<TResolvedHost>> => {
  if (isNull(host)) return resolve(host);

  const cached = await readCachedHost(host);
  if (cached) return cached;

  const resolved = await resolve(host);
  if (resolved) await writeCachedHost(host, resolved);
  return resolved;
};

export const expireProxyTenantCache = async (
  tenantIds: string[],
): Promise<void> => {
  const tags = tenantIds.map((tenantId) =>
    buildProxyTenantCacheTag(getNamespace(), tenantId),
  );
  for (const batch of chunk(tags, EXPIRE_TAG_BATCH_SIZE)) {
    await getProxyTenantCache().expireTag(batch);
  }
};
