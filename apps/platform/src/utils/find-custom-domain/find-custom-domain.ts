import type { TMaybeUndefined } from '@blog/config/types';
import type { TTenantDomain } from '@blog/db/schema/tenant-domains';
import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';

export const findCustomDomain = (
  tenantDomains: Pick<TTenantDomain, 'domain'>[],
  primaryDomain: string,
  rootDomain: TMaybeUndefined<string>,
): TMaybeUndefined<string> =>
  tenantDomains
    .map(({ domain }) => domain)
    .find(
      (domain) =>
        domain !== primaryDomain && !isPlatformAddress(domain, rootDomain),
    );
