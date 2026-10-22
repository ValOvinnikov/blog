import type { TMaybeUndefined } from '@blog/config';
import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { DEPROVISIONING_START_FAILED_EVENT } from '@worker/constants/deprovisioning';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { TEST_ENQUEUE_SECRET } from '@worker/testing/enqueue/fixtures';
import { signedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { deprovisionTenant } from '@worker/workflows/deprovision-tenant';
import { start } from 'workflow/api';

import { POST } from './route';

const DEPROVISION_URL = 'https://worker.example.com/api/deprovision';
const RUN_ID = 'deprovision-run';

const QUEUE_DOWN = 'queue down';
const FORGED_SECRET = 'forged-secret';

const mockEnv = vi.hoisted((): Record<string, TMaybeUndefined<string>> => ({}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));
vi.mock('@worker/workflows/deprovision-tenant', () => ({
  deprovisionTenant: vi.fn(),
}));
vi.mock('workflow/api', () => ({ start: vi.fn() }));
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);

function deprovisionRequest(secret: string = TEST_ENQUEUE_SECRET): Request {
  return signedRequest(
    DEPROVISION_URL,
    JSON.stringify({ tenantId: TEST_TENANT_ID }),
    { secret },
  );
}

describe('POST /api/deprovision', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = TEST_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(makeTenant());
    vi.mocked(start).mockResolvedValue({ runId: RUN_ID } as never);
  });

  it('starts the deprovisioning run and answers with its id', async () => {
    const response = await POST(deprovisionRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    await expect(response.json()).resolves.toEqual({ runId: RUN_ID });
    expect(start).toHaveBeenCalledWith(deprovisionTenant, [TEST_TENANT_ID]);
  });

  it('refuses a request signed with the wrong secret', async () => {
    const response = await POST(deprovisionRequest(FORGED_SECRET));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers not found for an unknown tenant without starting a run', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    const response = await POST(deprovisionRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.NOT_FOUND,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('logs and answers a server error when the run cannot be started', async () => {
    vi.mocked(start).mockRejectedValue(new Error(QUEUE_DOWN));

    const response = await POST(deprovisionRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_START_FAILED_EVENT,
      {
        tenantId: TEST_TENANT_ID,
        error: QUEUE_DOWN,
      },
    );
  });
});
