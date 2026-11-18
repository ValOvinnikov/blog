import { faker } from '@faker-js/faker';
import { HTTP_STATUS } from '@shinefold/config/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_SANITY_USER_ID,
} from '@worker/testing/member-access/fixtures';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { revokeMemberAccess } from '@worker/units/revoke-member-access';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';

import { POST } from './route';

faker.seed(7168);

const MOCK_NOT_AN_EMAIL = faker.lorem.slug();
const MOCK_REVOKE_URL = `${MOCK_WORKER_ORIGIN}/api/member-access/revoke`;

vi.mock('@worker/utils/env/env');
vi.mock('@worker/units/revoke-member-access');
vi.mock('@shinefold/db/queries/tenants');

function revokeRequest(
  body: Record<string, string> = { memberEmail: MOCK_MEMBER_EMAIL },
  secret: string = MOCK_ENQUEUE_SECRET,
): Request {
  return mockSignedRequest(
    MOCK_REVOKE_URL,
    JSON.stringify({ tenantId: MOCK_TENANT_ID, ...body }),
    { secret },
  );
}

describe('POST /api/member-access/revoke', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());
  });

  it("revokes the removed member's Studio access", async () => {
    const response = await POST(revokeRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    expect(revokeMemberAccess).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      email: MOCK_MEMBER_EMAIL,
      sanityUserId: undefined,
    });
  });

  it('passes their Sanity user id on, trimmed', async () => {
    await POST(
      revokeRequest({
        memberEmail: ` ${MOCK_MEMBER_EMAIL}\n`,
        sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
      }),
    );

    expect(revokeMemberAccess).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      email: MOCK_MEMBER_EMAIL,
      sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
    });
  });

  it('answers 401 and revokes nothing for a bad signature', async () => {
    const response = await POST(
      revokeRequest({ memberEmail: MOCK_MEMBER_EMAIL }, MOCK_FORGED_SECRET),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(revokeMemberAccess).not.toHaveBeenCalled();
  });

  it('answers 400 for a member email that is not an address', async () => {
    const response = await POST(
      revokeRequest({ memberEmail: MOCK_NOT_AN_EMAIL }),
    );

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(revokeMemberAccess).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    const response = await POST(revokeRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(revokeMemberAccess).not.toHaveBeenCalled();
  });

  it('logs and answers 500 when the revoke fails', async () => {
    vi.mocked(revokeMemberAccess).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    const response = await POST(revokeRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(MEMBER_ACCESS_LOG.REVOKE_FAILED, {
      tenantId: MOCK_TENANT_ID,
      error: MOCK_SANITY_OUTAGE,
    });
  });
});
