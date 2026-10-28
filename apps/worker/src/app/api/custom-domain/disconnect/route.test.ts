import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantByDomain } from '@blog/db/queries/tenant-domains/get-tenant-by-domain';
import { getTenantById } from '@blog/db/queries/tenants';
import { CUSTOM_DOMAIN_LOG } from '@worker/constants/custom-domain';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { disconnectCustomDomain } from '@worker/workflows/disconnect-custom-domain';
import { start } from 'workflow/api';

import { POST } from './route';

const MOCK_DISCONNECT_URL = `${MOCK_WORKER_ORIGIN}/api/custom-domain/disconnect`;

vi.mock('@worker/utils/env/env');
vi.mock('@worker/workflows/disconnect-custom-domain');
vi.mock('workflow/api');
vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/db/queries/tenant-domains/get-tenant-by-domain');

function disconnectRequest(
  body: Record<string, string> = {
    tenantId: MOCK_TENANT_ID,
    domain: MOCK_CUSTOM_DOMAIN,
  },
  secret: string = MOCK_ENQUEUE_SECRET,
): Request {
  return mockSignedRequest(MOCK_DISCONNECT_URL, JSON.stringify(body), {
    secret,
  });
}

describe('POST /api/custom-domain/disconnect', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());
    vi.mocked(getTenantByDomain).mockResolvedValue(undefined);
    vi.mocked(start).mockResolvedValue({ runId: MOCK_RUN_ID } as never);
  });

  it('starts the disconnect run and answers with its id', async () => {
    const response = await POST(disconnectRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    await expect(response.json()).resolves.toEqual({ runId: MOCK_RUN_ID });
    expect(start).toHaveBeenCalledWith(disconnectCustomDomain, [
      MOCK_TENANT_ID,
      MOCK_CUSTOM_DOMAIN,
    ]);
  });

  it('refuses a request signed with the wrong secret', async () => {
    const response = await POST(
      disconnectRequest(undefined, MOCK_FORGED_SECRET),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it('refuses a body without a valid domain', async () => {
    const response = await POST(
      disconnectRequest({ tenantId: MOCK_TENANT_ID }),
    );

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.INVALID_BODY,
    });
  });

  it('answers not found for an unknown tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    const response = await POST(disconnectRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers a conflict while any tenant still routes the domain', async () => {
    vi.mocked(getTenantByDomain).mockResolvedValue(mockTenant());

    const response = await POST(disconnectRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.DOMAIN_STILL_ASSIGNED,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('logs and answers a server error when the run cannot be started', async () => {
    vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await POST(disconnectRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.DISCONNECT_START_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        domain: MOCK_CUSTOM_DOMAIN,
        error: MOCK_QUEUE_DOWN,
      },
    );
  });
});
