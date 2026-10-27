import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { DEPROVISIONING_START_FAILED_EVENT } from '@worker/constants/deprovisioning';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import {
  MOCK_FORGED_SECRET,
  MOCK_ENQUEUE_SECRET,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import { mockTenant, MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { deprovisionTenant } from '@worker/workflows/deprovision-tenant';
import { start } from 'workflow/api';

import { POST } from './route';

const DEPROVISION_URL = 'https://worker.example.com/api/deprovision';

vi.mock('@worker/utils/env/env');
vi.mock('@worker/workflows/deprovision-tenant');
vi.mock('workflow/api');
vi.mock('@blog/db/queries/tenants');

function deprovisionRequest(secret: string = MOCK_ENQUEUE_SECRET): Request {
  return mockSignedRequest(
    DEPROVISION_URL,
    JSON.stringify({ tenantId: MOCK_TENANT_ID }),
    { secret },
  );
}

describe('POST /api/deprovision', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());
    vi.mocked(start).mockResolvedValue({ runId: MOCK_RUN_ID } as never);
  });

  it('starts the deprovisioning run and answers with its id', async () => {
    const response = await POST(deprovisionRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    await expect(response.json()).resolves.toEqual({ runId: MOCK_RUN_ID });
    expect(start).toHaveBeenCalledWith(deprovisionTenant, [MOCK_TENANT_ID]);
  });

  it('refuses a request signed with the wrong secret', async () => {
    const response = await POST(deprovisionRequest(MOCK_FORGED_SECRET));

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
    vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await POST(deprovisionRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_START_FAILED_EVENT,
      {
        tenantId: MOCK_TENANT_ID,
        error: MOCK_QUEUE_DOWN,
      },
    );
  });
});
