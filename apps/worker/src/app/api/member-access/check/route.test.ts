import { HTTP_STATUS } from '@shinefold/config/constants';
import { getMemberStudioAccess } from '@shinefold/db/queries/memberships';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import {
  MOCK_MEMBERSHIP_ID,
  mockMemberTarget,
} from '@worker/testing/member-access/fixtures';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { wakeMemberAccess } from '@worker/utils/member-access-run/member-access-run';

import { POST } from './route';

const MOCK_CHECK_URL = `${MOCK_WORKER_ORIGIN}/api/member-access/check`;

vi.mock('@worker/utils/env/env');
vi.mock('@worker/utils/member-access-run/member-access-run');
vi.mock('@shinefold/db/queries/memberships');
vi.mock('@shinefold/db/queries/tenants');

function checkRequest(
  body: Record<string, string> = { membershipId: MOCK_MEMBERSHIP_ID },
  secret: string = MOCK_ENQUEUE_SECRET,
): Request {
  return mockSignedRequest(
    MOCK_CHECK_URL,
    JSON.stringify({ tenantId: MOCK_TENANT_ID, ...body }),
    { secret },
  );
}

describe('POST /api/member-access/check', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());
    vi.mocked(getMemberStudioAccess).mockResolvedValue(mockMemberTarget());
  });

  it('runs a check for the member straight away', async () => {
    const response = await POST(checkRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    expect(wakeMemberAccess).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_MEMBERSHIP_ID,
    );
  });

  it('answers 401 and checks nothing for a bad signature', async () => {
    const response = await POST(
      checkRequest({ membershipId: MOCK_MEMBERSHIP_ID }, MOCK_FORGED_SECRET),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(wakeMemberAccess).not.toHaveBeenCalled();
  });

  it('answers 400 without a membership id', async () => {
    const response = await POST(checkRequest({}));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(wakeMemberAccess).not.toHaveBeenCalled();
  });

  it.each([
    [
      'an unknown tenant',
      () => vi.mocked(getTenantById).mockResolvedValue(undefined),
      HTTP_STATUS.NOT_FOUND,
      ENQUEUE_ERROR.NOT_FOUND,
    ],
    [
      'a membership that is gone',
      () => vi.mocked(getMemberStudioAccess).mockResolvedValue(undefined),
      HTTP_STATUS.NOT_FOUND,
      ENQUEUE_ERROR.NOT_FOUND,
    ],
    [
      'a tenant with no Sanity project',
      () => vi.mocked(getTenantById).mockResolvedValue(mockTenant()),
      HTTP_STATUS.CONFLICT,
      ENQUEUE_ERROR.NOT_PROVISIONED,
    ],
  ])('refuses %s and checks nothing', async (_, arrange, status, error) => {
    arrange();

    const response = await POST(checkRequest());

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(wakeMemberAccess).not.toHaveBeenCalled();
  });

  it('logs and answers 500 when the check cannot be started', async () => {
    vi.mocked(wakeMemberAccess).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await POST(checkRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      MEMBER_ACCESS_LOG.CHECK_NOW_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        membershipId: MOCK_MEMBERSHIP_ID,
        error: MOCK_QUEUE_DOWN,
      },
    );
  });
});
