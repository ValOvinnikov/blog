import {
  DOMAIN_VERIFICATION_STATUS,
  ROUTING_RECORD_TYPE,
} from '@platform/constants/domain';
import type { TProjectDomain } from '@platform/server/provisioning/project-domain';
import { MOCK_VERCEL_A_RECORD } from '@platform/testing/tenants/fixtures';

export const MOCK_APEX_RECORD_NAME = '@';

export const mockPendingProjectDomain = (): TProjectDomain => ({
  status: DOMAIN_VERIFICATION_STATUS.PENDING,
  dnsRecords: [
    {
      type: ROUTING_RECORD_TYPE.A,
      name: MOCK_APEX_RECORD_NAME,
      value: MOCK_VERCEL_A_RECORD,
    },
  ],
});
