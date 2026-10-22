import type { TMaybeUndefined } from '@blog/config';
import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { signedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { SANITY_PROJECT_ID } from '@worker/testing/owner-access/fixtures';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { wakeOwnerAccess } from '@worker/utils/owner-access-run/owner-access-run';

import { POST } from './route';

const SECRET = 'enqueue-secret';
const CHECK_URL = 'https://worker.example.com/api/owner-access/check';

const mockEnv = vi.hoisted((): Record<string, TMaybeUndefined<string>> => ({}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));
vi.mock('@worker/utils/owner-access-run/owner-access-run');
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);

function checkRequest(secret: string = SECRET): Request {
  return signedRequest(
    CHECK_URL,
    JSON.stringify({ tenantId: TEST_TENANT_ID }),
    {
      secret,
    },
  );
}

describe('POST /api/owner-access/check', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = SECRET;
    vi.mocked(getTenantById).mockResolvedValue(
      makeTenant({ sanityProjectId: SANITY_PROJECT_ID }),
    );
  });

  it('runs a check for the tenant straight away', async () => {
    const response = await POST(checkRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    expect(wakeOwnerAccess).toHaveBeenCalledWith(TEST_TENANT_ID);
  });

  it('answers 401 and checks nothing for a bad signature', async () => {
    const response = await POST(checkRequest('other'));

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
    vi.mocked(getTenantById).mockResolvedValue(makeTenant());

    const response = await POST(checkRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.NOT_PROVISIONED,
    });
    expect(wakeOwnerAccess).not.toHaveBeenCalled();
  });

  it('answers 500 when the check cannot be started', async () => {
    vi.mocked(wakeOwnerAccess).mockRejectedValue(new Error('queue down'));

    const response = await POST(checkRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
  });
});
