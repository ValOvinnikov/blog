import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';
import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TTenantDomain } from '@shinefold/db/schema/tenant-domains';

export const findSubdomain = (
  tenantDomains: Pick<TTenantDomain, 'domain'>[],
  rootDomain: TMaybeUndefined<string>,
): TMaybeUndefined<string> =>
  tenantDomains
    .map(({ domain }) => domain)
    .find((domain) => isPlatformAddress(domain, rootDomain));
