import type { TMaybeNull } from '@blog/config';
import { isDomainHeldByAnyTenant } from '@blog/db/queries/tenant-domains/is-domain-held-by-any-tenant';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { env } from '@worker/utils/env/env';
import { requireValues } from '@worker/utils/require-values/require-values';

export type TDisconnectRefusal =
  | typeof ENQUEUE_ERROR.DOMAIN_STILL_ASSIGNED
  | typeof ENQUEUE_ERROR.DOMAIN_RESERVED;

export async function getDisconnectRefusal(
  domain: string,
): Promise<TMaybeNull<TDisconnectRefusal>> {
  const { WEB_APP_URL, PLATFORM_APP_BASE_URL } = requireValues({
    WEB_APP_URL: env.WEB_APP_URL,
    PLATFORM_APP_BASE_URL: env.PLATFORM_APP_BASE_URL,
  });

  const appHosts = [WEB_APP_URL, PLATFORM_APP_BASE_URL].map(
    (url) => new URL(url).hostname,
  );
  if (appHosts.includes(domain)) return ENQUEUE_ERROR.DOMAIN_RESERVED;

  return (await isDomainHeldByAnyTenant(domain))
    ? ENQUEUE_ERROR.DOMAIN_STILL_ASSIGNED
    : null;
}
