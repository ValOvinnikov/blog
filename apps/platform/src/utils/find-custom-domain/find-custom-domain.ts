import { isCustomDomain } from '@platform/utils/is-custom-domain/is-custom-domain';
import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TTenantDomain } from '@shinefold/db/schema/tenant-domains';

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
