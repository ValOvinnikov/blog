import { HTTP_STATUS } from '@shinefold/config/constants';
import { getMemberStudioAccess } from '@shinefold/db/queries/memberships';
import { getTenantById } from '@shinefold/db/queries/tenants';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import {
  MOCK_MEMBERSHIP_ID,
  mockMemberTarget,
} from '@worker/testing/member-access/fixtures';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { resendMemberInvite } from '@worker/units/resend-member-invite';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { wakeMemberAccess } from '@worker/utils/member-access-run/member-access-run';

import { POST } from './route';

const MOCK_RESEND_URL = `${MOCK_WORKER_ORIGIN}/api/member-access/resend`;

vi.mock('@worker/utils/env/env');
vi.mock('@worker/units/resend-member-invite');
vi.mock('@worker/utils/member-access-run/member-access-run');
vi.mock('@shinefold/db/queries/memberships');
vi.mock('@shinefold/db/queries/tenants');

function resendRequest(): Request {
  return mockSignedRequest(
    MOCK_RESEND_URL,
    JSON.stringify({
      tenantId: MOCK_TENANT_ID,
      membershipId: MOCK_MEMBERSHIP_ID,
    }),
    { secret: MOCK_ENQUEUE_SECRET },
  );
}

describe('POST /api/member-access/resend', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());
    vi.mocked(getMemberStudioAccess).mockResolvedValue(mockMemberTarget());
  });

  it('resends the invite, then restarts the checks', async () => {
    const order: string[] = [];
    vi.mocked(resendMemberInvite).mockImplementation(async () => {
      order.push('resend');
    });
    vi.mocked(wakeMemberAccess).mockImplementation(async () => {
      order.push('wake');
    });

    const response = await POST(resendRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    expect(resendMemberInvite).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_MEMBERSHIP_ID,
    );
    expect(order).toEqual(['resend', 'wake']);
  });

  it('answers 500 and restarts nothing when the resend fails', async () => {
    vi.mocked(resendMemberInvite).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    const response = await POST(resendRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(wakeMemberAccess).not.toHaveBeenCalled();
  });
});
