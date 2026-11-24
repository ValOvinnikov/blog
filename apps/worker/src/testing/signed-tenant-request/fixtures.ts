import { TENANT_STATUS } from '@shinefold/db/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { MOCK_ENQUEUE_SECRET } from '@worker/testing/enqueue/fixtures';
import {
  MOCK_ENCRYPTED_TOKEN,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';

const MOCK_WRITABLE_TENANT = mockProvisionedTenant({
  sanityWriteTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
});

export const MOCK_SUSPENDED_WRITABLE_TENANT = mockProvisionedTenant({
  status: TENANT_STATUS.SUSPENDED,
  sanityWriteTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
});

export function arrangeSignedWritableTenant(): void {
  mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
  vi.mocked(getTenantById).mockResolvedValue(MOCK_WRITABLE_TENANT);
}
