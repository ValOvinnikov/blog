import type { TDomainVerificationStatus } from '@blog/config';

import { getProjectDomain } from './vercel-domains-api';

/**
 * Informational only: a tenant counts as provisioned once its domain is added
 * to the Vercel project, not once DNS verifies, which is tenant-controlled and
 * can take hours.
 */
export const getDomainVerificationStatus = async (
  domain: string,
): Promise<TDomainVerificationStatus> =>
  (await getProjectDomain(domain)).status;
