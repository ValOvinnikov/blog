'use server';

import { queries } from '@blog/db';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { logger } from '@platform/utils/logger/logger';

import {
  getDomainVerificationStatus,
  type TDomainVerificationStatus,
} from './get-domain-verification-status';

/**
 * Polled by `ProvisioningStatusView` on its own, slower interval — this
 * makes a live Vercel API call (up to 5s), so it runs independently of the
 * step-status poll rather than sharing that tighter cadence. Takes a
 * `tenantId`, not a domain: a Server Action's arguments are attacker-
 * controlled regardless of what the UI happens to pass, so the domain that
 * reaches Vercel's API is always resolved from the tenant's own database
 * row here, never taken directly from the caller.
 */
export const getDomainVerificationStatusAction = async (
  tenantId: string,
): Promise<TDomainVerificationStatus> => {
  await requireAdmin();

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);
  if (!tenant) {
    logger.error('provisioning.domain_check_tenant_not_found', { tenantId });
    return 'ERROR';
  }

  return getDomainVerificationStatus(tenant.primaryDomain);
};
