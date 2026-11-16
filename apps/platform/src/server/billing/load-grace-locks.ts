import 'server-only';

import { env } from '@platform/utils/env/env';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import {
  findGraceLocks,
  type TGraceLocks,
} from '@shinefold/db/utils/grace-locks/grace-locks';

export const loadGraceLocks = async (
  tenant: Pick<TPlatformTenant, 'id' | 'primaryDomain' | 'entitlements'>,
): Promise<TMaybeUndefined<TGraceLocks>> => {
  const rootDomain = env.TENANT_ROOT_DOMAIN;
  if (!rootDomain) return undefined;

  const hosts = await queries.tenantDomains.listTenantHosts(tenant);

  return findGraceLocks(tenant, tenant.entitlements, hosts, rootDomain);
};
