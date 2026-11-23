import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { GROWTH_LAYER_LOG } from '@worker/constants/growth-layer';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import {
  MOCK_ENCRYPTED_TOKEN,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { applyGrowthLayerOnUpgrade } from '@worker/workflows/apply-growth-layer-on-upgrade';
import { start } from 'workflow/api';

import { POST } from './route';

const MOCK_APPLY_URL = `${MOCK_WORKER_ORIGIN}/api/growth-layer/apply`;
const MOCK_BODY = JSON.stringify({ tenantId: MOCK_TENANT_ID });

vi.mock('@worker/utils/env/env');
vi.mock('@worker/workflows/apply-growth-layer-on-upgrade');
vi.mock('workflow/api');
vi.mock('@shinefold/db/queries/tenants');

function applyRequest(
  body: string = MOCK_BODY,
  secret: string = MOCK_ENQUEUE_SECRET,
): Request {
  return mockSignedRequest(MOCK_APPLY_URL, body, { secret });
}

describe('POST /api/growth-layer/apply', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(
      mockProvisionedTenant({
        sanityWriteTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
      }),
    );
    vi.mocked(start).mockResolvedValue({ runId: MOCK_RUN_ID } as never);
  });

  it('starts the Growth layer run for the tenant and answers with its id', async () => {
    const response = await POST(applyRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    await expect(response.json()).resolves.toEqual({ runId: MOCK_RUN_ID });
    expect(start).toHaveBeenCalledWith(applyGrowthLayerOnUpgrade, [
      MOCK_TENANT_ID,
    ]);
  });

  it('refuses an unsigned request', async () => {
    const response = await POST(
      new Request(MOCK_APPLY_URL, {
        method: HTTP_METHOD.POST,
        body: MOCK_BODY,
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it('refuses a request signed with the wrong secret', async () => {
    const response = await POST(applyRequest(MOCK_BODY, MOCK_FORGED_SECRET));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it('refuses a body without a tenant id', async () => {
    const response = await POST(applyRequest(JSON.stringify({})));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.INVALID_BODY,
    });
  });

  it('answers not found for an unknown or archived tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    const response = await POST(applyRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers a conflict when the tenant has no seeded Sanity project yet', async () => {
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());

    const response = await POST(applyRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.NOT_PROVISIONED,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('logs and answers a server error when the run cannot be started', async () => {
    vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await POST(applyRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      GROWTH_LAYER_LOG.APPLY_START_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_QUEUE_DOWN },
    );
  });
});
