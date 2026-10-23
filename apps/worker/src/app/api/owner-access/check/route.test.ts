import type { TMaybeUndefined } from '@blog/config';
import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { wakeOwnerAccess } from '@worker/utils/owner-access-run/owner-access-run';

import { POST } from './route';

const CHECK_URL = 'https://worker.example.com/api/owner-access/check';

const mockEnv = vi.hoisted((): Record<string, TMaybeUndefined<string>> => ({}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));
vi.mock('@worker/utils/owner-access-run/owner-access-run');
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);

function checkRequest(secret: string = MOCK_ENQUEUE_SECRET): Request {
  return mockSignedRequest(
    CHECK_URL,
    JSON.stringify({ tenantId: MOCK_TENANT_ID }),
    {
      secret,
    },
  );
}

describe('POST /api/owner-access/check', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());
  });

  it('runs a check for the tenant straight away', async () => {
    const response = await POST(checkRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    expect(wakeOwnerAccess).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('answers 401 and checks nothing for a bad signature', async () => {
    const response = await POST(checkRequest(MOCK_FORGED_SECRET));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(wakeOwnerAccess).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    const response = await POST(checkRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(await response.json()).toEqual({ error: ENQUEUE_ERROR.NOT_FOUND });
  });

  it('answers 409 while the tenant has no Sanity project', async () => {
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());

    const response = await POST(checkRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.NOT_PROVISIONED,
    });
    expect(wakeOwnerAccess).not.toHaveBeenCalled();
  });

  it('answers 500 when the check cannot be started', async () => {
    vi.mocked(wakeOwnerAccess).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await POST(checkRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
  });
});
