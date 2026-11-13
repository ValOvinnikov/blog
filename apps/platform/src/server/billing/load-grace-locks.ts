import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { env } from '@platform/utils/env/env';
import { findSubdomain } from '@platform/utils/find-subdomain/find-subdomain';
import { isCustomDomain } from '@platform/utils/is-custom-domain/is-custom-domain';

type TGraceDomainRedirect = {
  customDomain: string;
  subdomain: string;
};

export type TGraceLocks = {
  lockedMemberCount: number;
  domainRedirect: TMaybeUndefined<TGraceDomainRedirect>;
};

const findDomainRedirect = async (
  { id, plan, primaryDomain }: Pick<TTenant, 'id' | 'plan' | 'primaryDomain'>,
  rootDomain: TMaybeUndefined<string>,
): Promise<TMaybeUndefined<TGraceDomainRedirect>> => {
  if (PLAN_ENTITLEMENTS[plan].hasCustomDomain) return undefined;
  if (!isCustomDomain(primaryDomain, rootDomain)) return undefined;

  const tenantDomains = await queries.tenantDomains.listTenantDomains(id);
  const subdomain = findSubdomain(tenantDomains, rootDomain);

  return subdomain ? { customDomain: primaryDomain, subdomain } : undefined;
};

export const loadGraceLocks = async (
  tenant: Pick<TTenant, 'id' | 'plan' | 'primaryDomain'>,
): Promise<TGraceLocks> => {
  const [lockedMemberCount, domainRedirect] = await Promise.all([
    queries.memberships.countMembershipsOverSeats(
      tenant.id,
      PLAN_ENTITLEMENTS[tenant.plan].seats,
    ),
    findDomainRedirect(tenant, env.TENANT_ROOT_DOMAIN),
  ]);

  return { lockedMemberCount, domainRedirect };
};

export const hasGraceLocks = ({
  lockedMemberCount,
  domainRedirect,
}: TGraceLocks): boolean => lockedMemberCount > 0 || Boolean(domainRedirect);
