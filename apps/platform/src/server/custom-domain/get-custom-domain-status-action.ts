'use server';

import { queries } from '@blog/db';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { env } from '@platform/utils/env/env';
import { findCustomDomain } from '@platform/utils/find-custom-domain/find-custom-domain';

export const getCustomDomainStatusAction = async (
  tenantId: string,
): Promise<TDomainVerificationStatus> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const customDomain = findCustomDomain(
    await queries.tenantDomains.listTenantDomains(tenant.id),
    tenant.primaryDomain,
    env.TENANT_ROOT_DOMAIN,
  );

  return customDomain
    ? getDomainVerificationStatus(customDomain)
    : DOMAIN_VERIFICATION_STATUS.NOT_ADDED;
};
