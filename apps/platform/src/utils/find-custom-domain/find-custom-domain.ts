import type { TMaybeUndefined } from '@blog/config/types';
import type { TTenantDomain } from '@blog/db/schema/tenant-domains';
import { isCustomDomain } from '@platform/utils/is-custom-domain/is-custom-domain';

export const findCustomDomain = (
  tenantDomains: Pick<TTenantDomain, 'domain'>[],
  primaryDomain: string,
  rootDomain: TMaybeUndefined<string>,
): TMaybeUndefined<string> =>
  tenantDomains
    .map(({ domain }) => domain)
    .find(
      (domain) =>
        domain !== primaryDomain && isCustomDomain(domain, rootDomain),
    );
