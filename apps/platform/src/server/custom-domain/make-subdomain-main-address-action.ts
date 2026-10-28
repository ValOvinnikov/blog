'use server';

import { ACTION_OUTCOME } from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_REFUSAL,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { env } from '@platform/utils/env/env';
import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

import {
  switchMainAddress,
  type TSwitchMainAddressResult,
} from './switch-main-address';

const refused = (reason: TCustomDomainRefusal): TSwitchMainAddressResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

export const makeSubdomainMainAddressAction = async (
  tenantId: string,
): Promise<TSwitchMainAddressResult> => {
  const { tenant } = await requireTenantOwner(tenantId);
  const { id, deprovisionedAt, primaryDomain } = tenant;
  const rootDomain = env.TENANT_ROOT_DOMAIN;

  if (deprovisionedAt) return refused(CUSTOM_DOMAIN_REFUSAL.ARCHIVED);
  if (isPlatformAddress(primaryDomain, rootDomain)) {
    return refused(CUSTOM_DOMAIN_REFUSAL.ALREADY_MAIN_ADDRESS);
  }

  try {
    const subdomain = (await queries.tenantDomains.listTenantDomains(id))
      .map(({ domain }) => domain)
      .find((domain) => isPlatformAddress(domain, rootDomain));
    if (!subdomain) return refused(CUSTOM_DOMAIN_REFUSAL.ADDRESS_NOT_FOUND);

    return await switchMainAddress({
      tenantId: id,
      from: primaryDomain,
      to: subdomain,
    });
  } catch (error) {
    logger.error(CUSTOM_DOMAIN_LOG.MAIN_ADDRESS_FAILED, {
      tenantId: id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
