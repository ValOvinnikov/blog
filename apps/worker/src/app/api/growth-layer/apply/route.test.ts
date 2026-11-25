import { HTTP_STATUS } from '@shinefold/config/constants';
import { GROWTH_LAYER_LOG } from '@worker/constants/growth-layer';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import { arrangeSignedWritableTenant } from '@worker/testing/signed-tenant-request/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { applyGrowthLayerOnUpgrade } from '@worker/workflows/apply-growth-layer-on-upgrade';
import { start } from 'workflow/api';

import { POST } from './route';

vi.mock('@worker/utils/env/env');
vi.mock('@worker/workflows/apply-growth-layer-on-upgrade');
vi.mock('workflow/api');
vi.mock('@shinefold/db/queries/tenants');

function applyRequest(): Request {
  return mockSignedRequest(
    `${MOCK_WORKER_ORIGIN}/api/growth-layer/apply`,
    JSON.stringify({ tenantId: MOCK_TENANT_ID }),
    { secret: MOCK_ENQUEUE_SECRET },
  );
}

describe('POST /api/growth-layer/apply', () => {
  beforeEach(() => {
    arrangeSignedWritableTenant();
  });

  it('starts the Growth layer run for the tenant and answers with its id', async () => {
    vi.mocked(start).mockResolvedValue({ runId: MOCK_RUN_ID } as never);

    const response = await POST(applyRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    await expect(response.json()).resolves.toEqual({ runId: MOCK_RUN_ID });
    expect(start).toHaveBeenCalledWith(applyGrowthLayerOnUpgrade, [
      MOCK_TENANT_ID,
    ]);
  });

  it('logs the apply start failure when the run cannot be started', async () => {
    vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    await POST(applyRequest());

    expect(logger.error).toHaveBeenCalledWith(
      GROWTH_LAYER_LOG.APPLY_START_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_QUEUE_DOWN },
    );
  });
});
