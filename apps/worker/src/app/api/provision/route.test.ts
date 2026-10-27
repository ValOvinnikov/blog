import { ERROR_CODE, HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import {
  beginTenantProvisioning,
  finishProvisioningRun,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import { ENQUEUE_MAX_AGE_MS } from '@blog/utils/enqueue-signature';
import { errorResult, okResult } from '@blog/utils/result';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { MOCK_NOW, freezeClock } from '@worker/testing/clock/frozen-clock';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_DB_DOWN, MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import { mockTenant, MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { provisionTenant } from '@worker/workflows/provision-tenant';
import { start } from 'workflow/api';

import { POST } from './route';

const MOCK_PROVISION_URL = `${MOCK_WORKER_ORIGIN}/api/provision`;
const MOCK_NON_UUID_TENANT_ID = 'not-a-uuid';

function signedRequest(
  rawBody: string,
  overrides: { secret?: string; timestamp?: number } = {},
): Request {
  return mockSignedRequest(MOCK_PROVISION_URL, rawBody, {
    secret: MOCK_ENQUEUE_SECRET,
    ...overrides,
  });
}

vi.mock('@worker/utils/env/env');
vi.mock('@worker/workflows/provision-tenant');
vi.mock('workflow/api');
vi.mock('@blog/db/queries/tenants');

function enqueueRequest(tenantId: string = MOCK_TENANT_ID): Request {
  return signedRequest(JSON.stringify({ tenantId }));
}

describe('POST /api/provision', () => {
  beforeEach(() => {
    freezeClock();
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(beginTenantProvisioning).mockResolvedValue(
      okResult({ tenant: mockTenant(), previousProvisioningStatus: null }),
    );
    vi.mocked(updateProvisioningStep).mockResolvedValue(okResult(mockTenant()));
    vi.mocked(finishProvisioningRun).mockResolvedValue(okResult(mockTenant()));
    vi.mocked(start).mockResolvedValue({ runId: MOCK_RUN_ID } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    [
      'a tampered body',
      () =>
        new Request(MOCK_PROVISION_URL, {
          method: HTTP_METHOD.POST,
          headers: signedRequest('{}').headers,
          body: JSON.stringify({ tenantId: MOCK_TENANT_ID }),
        }),
    ],
    [
      'the wrong secret',
      () =>
        signedRequest(JSON.stringify({ tenantId: MOCK_TENANT_ID }), {
          secret: MOCK_FORGED_SECRET,
        }),
    ],
    [
      'no signature headers',
      () =>
        new Request(MOCK_PROVISION_URL, {
          method: HTTP_METHOD.POST,
          body: JSON.stringify({ tenantId: MOCK_TENANT_ID }),
        }),
    ],
    [
      'a stale timestamp',
      () =>
        signedRequest(JSON.stringify({ tenantId: MOCK_TENANT_ID }), {
          timestamp: MOCK_NOW.getTime() - ENQUEUE_MAX_AGE_MS - 1,
        }),
    ],
  ])('answers 401 and starts nothing for %s', async (_label, build) => {
    const response = await POST(build());

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.UNAUTHORIZED,
    });
    expect(beginTenantProvisioning).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 401 when the enqueue secret is not configured', async () => {
    mockEnv.WORKER_ENQUEUE_SECRET = undefined;

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.UNAUTHORIZED,
    });
  });

  it('answers 400 for a body that is not JSON', async () => {
    const response = await POST(signedRequest('not json'));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.INVALID_BODY,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it.each([
    ['a non-uuid tenant id', { tenantId: MOCK_NON_UUID_TENANT_ID }],
    ['a missing tenant id', {}],
  ])('answers 400 for %s', async (_label, body) => {
    const response = await POST(signedRequest(JSON.stringify(body)));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.INVALID_BODY,
    });
    expect(beginTenantProvisioning).not.toHaveBeenCalled();
  });

  it('answers 409 and starts no run while one is already in progress', async () => {
    vi.mocked(beginTenantProvisioning).mockResolvedValue(
      errorResult(ERROR_CODE.DB_ALREADY_PROVISIONING),
    );

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.ALREADY_IN_PROGRESS,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 404 for a tenant that does not exist', async () => {
    vi.mocked(beginTenantProvisioning).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(await response.json()).toEqual({ error: ENQUEUE_ERROR.NOT_FOUND });
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 500 when the guard fails for another reason', async () => {
    vi.mocked(beginTenantProvisioning).mockResolvedValue(
      errorResult(ERROR_CODE.DB_DUPLICATE_DOMAIN),
    );

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 500 when the guard query throws', async () => {
    vi.mocked(beginTenantProvisioning).mockRejectedValue(
      new Error(MOCK_DB_DOWN),
    );

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 202 with the run id once the run is started', async () => {
    const response = await POST(enqueueRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    expect(await response.json()).toEqual({ runId: MOCK_RUN_ID });
  });

  it('starts the workflow for the tenant that was enqueued', async () => {
    await POST(enqueueRequest());

    expect(start).toHaveBeenCalledWith(provisionTenant, [MOCK_TENANT_ID]);
  });

  describe('when the run cannot be started', () => {
    beforeEach(() => {
      vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));
    });

    it('answers 500', async () => {
      const response = await POST(enqueueRequest());

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(await response.json()).toEqual({
        error: ENQUEUE_ERROR.SERVER_ERROR,
      });
    });

    it('marks the tenant failed', async () => {
      await POST(enqueueRequest());

      const [failure] = vi.mocked(updateProvisioningStep).mock.lastCall ?? [];
      expect(failure?.tenantId).toBe(MOCK_TENANT_ID);
      expect(failure?.step).toBe(TENANT_PROVISIONING_STEP.SANITY_PROJECT);
      expect(failure?.status).toBe(TENANT_PROVISIONING_STEP_STATUS.FAILED);
      expect(failure?.provisioningStatus).toBe(
        TENANT_PROVISIONING_STATUS.FAILED,
      );
      expect(finishProvisioningRun).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT_ID,
      });
    });
  });

  it('never exposes the enqueue secret or internal error text', async () => {
    vi.mocked(start).mockRejectedValue(
      new Error(`leaked ${MOCK_ENQUEUE_SECRET}`),
    );

    const response = await POST(enqueueRequest());

    expect(await response.text()).not.toContain(MOCK_ENQUEUE_SECRET);
  });
});
