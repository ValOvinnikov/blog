'use server';

import { requireAdmin } from '@admin/server/auth/require-admin';

import {
  getDomainVerificationStatus,
  type TDomainVerificationStatus,
} from './get-domain-verification-status';

/**
 * Polled by `ProvisioningStatusView` on its own, slower interval — this
 * makes a live Vercel API call (up to 5s), so it runs independently of the
 * step-status poll rather than sharing that tighter cadence.
 */
export async function getDomainVerificationStatusAction(
  domain: string,
): Promise<TDomainVerificationStatus> {
  await requireAdmin();
  return getDomainVerificationStatus(domain);
}
