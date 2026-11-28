import type {
  TMaybeJsonDates,
  TMaybeNull,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isNull } from '@shinefold/utils/primitives';
import { getCache } from '@vercel/functions';
import { PROXY_LOG } from '@web/constants/proxy';
import { ONE_HOUR_IN_SECONDS } from '@web/constants/time';
import { reviveCachedTenant } from '@web/server/tenant/revive-cached-tenant/revive-cached-tenant';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { buildProxyTenantCacheTag } from '@web/utils/tenant-cache-tags';

export type TResolvedHost = { tenant: TTenant; isOwnHost: boolean };

type TCachedHost = { tenant: TMaybeJsonDates<TTenant>; isOwnHost: boolean };

const LOCAL_NAMESPACE = 'local';

// Vercel can share one Runtime Cache across a team's projects, and `VERCEL_ENV` reads `production` on both web projects.
const getNamespace = (): string => env.VERCEL_PROJECT_ID ?? LOCAL_NAMESPACE;

const getProxyTenantCache = () => getCache({ namespace: getNamespace() });

const readCachedHost = async (
  host: string,
): Promise<TMaybeUndefined<TResolvedHost>> => {
  try {
    const cached = (await getProxyTenantCache().get(
      host,
    )) as TMaybeNull<TCachedHost>;
    return cached
      ? { ...cached, tenant: reviveCachedTenant(cached.tenant) }
      : undefined;
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
    await getProxyTenantCache().set(host, resolved, {
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

export const expireProxyTenantCache = (tenantIds: string[]): Promise<void> =>
  getProxyTenantCache().expireTag(
    tenantIds.map((tenantId) =>
      buildProxyTenantCacheTag(getNamespace(), tenantId),
    ),
  );
