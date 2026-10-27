import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { MOCK_ENQUEUE_SECRET } from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { resendOwnerInvite } from '@worker/units/resend-owner-invite';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { wakeOwnerAccess } from '@worker/utils/owner-access-run/owner-access-run';

import { POST } from './route';

const RESEND_URL = 'https://worker.example.com/api/owner-access/resend';

vi.mock('@worker/utils/env/env');
vi.mock('@worker/units/resend-owner-invite');
vi.mock('@worker/utils/owner-access-run/owner-access-run');
vi.mock('@blog/db/queries/tenants');

function resendRequest(): Request {
  return mockSignedRequest(
    RESEND_URL,
    JSON.stringify({ tenantId: MOCK_TENANT_ID }),
    { secret: MOCK_ENQUEUE_SECRET },
  );
}

describe('POST /api/owner-access/resend', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());
  });

  it('resends the invite, then restarts the checks', async () => {
    const order: string[] = [];
    vi.mocked(resendOwnerInvite).mockImplementation(async () => {
      order.push('resend');
    });
    vi.mocked(wakeOwnerAccess).mockImplementation(async () => {
      order.push('wake');
    });

    const response = await POST(resendRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    expect(resendOwnerInvite).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(order).toEqual(['resend', 'wake']);
  });

  it('answers 500 and restarts nothing when the resend fails', async () => {
    vi.mocked(resendOwnerInvite).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    const response = await POST(resendRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(wakeOwnerAccess).not.toHaveBeenCalled();
  });
});
