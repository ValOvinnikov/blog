'use server';

import { queries } from '@blog/db';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { logger } from '@platform/utils/logger/logger';

import { getDomainVerificationStatus } from './get-domain-verification-status';

// Takes a tenant id, never a domain: Server Action arguments are caller-controlled.
export const getDomainVerificationStatusAction = async (
  tenantId: string,
): Promise<TDomainVerificationStatus> => {
  await requireAdmin();

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);
  if (!tenant) {
    logger.error('provisioning.domain_check_tenant_not_found', { tenantId });
    return DOMAIN_VERIFICATION_STATUS.ERROR;
  }

  return getDomainVerificationStatus(tenant.primaryDomain);
};
