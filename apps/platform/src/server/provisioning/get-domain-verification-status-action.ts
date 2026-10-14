'use server';

import { queries } from '@blog/db';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { requireAdmin } from '@platform/server/auth/require-admin';

import { getDomainVerificationStatus } from './get-domain-verification-status';

export const getDomainVerificationStatusAction = async (
  tenantId: string,
): Promise<TDomainVerificationStatus> => {
  await requireAdmin();

  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    return DOMAIN_VERIFICATION_STATUS.ERROR;
  }

  return getDomainVerificationStatus(tenant.primaryDomain);
};
