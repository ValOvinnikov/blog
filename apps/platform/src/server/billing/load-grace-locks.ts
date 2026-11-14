import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import {
  findGraceLocks,
  type TGraceLocks,
} from '@blog/db/utils/grace-locks/grace-locks';
import { env } from '@platform/utils/env/env';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const loadGraceLocks = async (
  tenant: Pick<TPlatformTenant, 'id' | 'primaryDomain' | 'entitlements'>,
): Promise<TMaybeUndefined<TGraceLocks>> => {
  const rootDomain = env.TENANT_ROOT_DOMAIN;
  if (!rootDomain) return undefined;

  const hosts = await queries.tenantDomains.listTenantHosts(tenant);

  return findGraceLocks(tenant, tenant.entitlements, hosts, rootDomain);
};
