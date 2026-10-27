import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import type { TProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { MOCK_VERCEL_A_RECORD } from '@platform/testing/tenants/fixtures';

export const mockPendingProjectDomain = (): TProjectDomain => ({
  status: DOMAIN_VERIFICATION_STATUS.PENDING,
  dnsRecords: [{ type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD }],
});
