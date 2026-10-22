import type { TMaybeUndefined } from '@blog/config';
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
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { signedRequest as signedRequestTo } from '@worker/testing/enqueue/sign-enqueue-request';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { start } from 'workflow/api';

import { POST } from './route';

const SECRET = 'enqueue-secret';
const TENANT_ID = TEST_TENANT_ID;
const PROVISION_URL = 'https://worker.example.com/api/provision';

function signedRequest(
  rawBody: string,
  overrides: { secret?: string; timestamp?: number } = {},
): Request {
  return signedRequestTo(PROVISION_URL, rawBody, {
    secret: SECRET,
    ...overrides,
  });
}

const mockEnv = vi.hoisted((): Record<string, TMaybeUndefined<string>> => ({}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));
vi.mock('@worker/workflows/provision-tenant', () => ({
  provisionTenant: vi.fn(),
}));
vi.mock('workflow/api', () => ({ start: vi.fn() }));
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);

function enqueueRequest(tenantId: string = TENANT_ID): Request {
  return signedRequest(JSON.stringify({ tenantId }));
}

describe('POST /api/provision', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = SECRET;
    vi.mocked(beginTenantProvisioning).mockResolvedValue({
      ok: true,
      data: { tenant: makeTenant(), previousProvisioningStatus: null },
    });
    vi.mocked(updateProvisioningStep).mockResolvedValue({
      ok: true,
      data: makeTenant(),
    });
    vi.mocked(finishProvisioningRun).mockResolvedValue({
      ok: true,
      data: makeTenant(),
    });
    vi.mocked(start).mockResolvedValue({ runId: 'run-1' } as never);
  });

  it.each([
    [
      'a tampered body',
      () =>
        new Request(PROVISION_URL, {
          method: HTTP_METHOD.POST,
          headers: signedRequest('{}').headers,
          body: JSON.stringify({ tenantId: TENANT_ID }),
        }),
    ],
    [
      'the wrong secret',
      () =>
        signedRequest(JSON.stringify({ tenantId: TENANT_ID }), {
          secret: 'other',
        }),
    ],
    [
      'no signature headers',
      () =>
        new Request(PROVISION_URL, {
          method: HTTP_METHOD.POST,
          body: JSON.stringify({ tenantId: TENANT_ID }),
        }),
    ],
    [
      'a stale timestamp',
      () =>
        signedRequest(JSON.stringify({ tenantId: TENANT_ID }), {
          timestamp: Date.now() - 10 * 60_000,
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
    ['a non-uuid tenant id', { tenantId: 'tenant-1' }],
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
    vi.mocked(beginTenantProvisioning).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.ALREADY_IN_PROGRESS,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 404 for a tenant that does not exist', async () => {
    vi.mocked(beginTenantProvisioning).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(await response.json()).toEqual({ error: ENQUEUE_ERROR.NOT_FOUND });
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 500 when the guard fails for another reason', async () => {
    vi.mocked(beginTenantProvisioning).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_DUPLICATE_DOMAIN,
    });

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 500 when the guard query throws', async () => {
    vi.mocked(beginTenantProvisioning).mockRejectedValue(new Error('boom'));

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
    expect(await response.json()).toEqual({ runId: 'run-1' });
  });

  it('starts the workflow for the tenant that was enqueued', async () => {
    await POST(enqueueRequest());

    expect(start).toHaveBeenCalledWith(expect.any(Function), [TENANT_ID]);
  });

  describe('when the run cannot be started', () => {
    beforeEach(() => {
      vi.mocked(start).mockRejectedValue(new Error('queue unavailable'));
    });

    it('answers 500', async () => {
      const response = await POST(enqueueRequest());

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(await response.json()).toEqual({
        error: ENQUEUE_ERROR.SERVER_ERROR,
      });
    });

    it('marks the tenant failed instead of leaving it in progress', async () => {
      await POST(enqueueRequest());

      expect(updateProvisioningStep).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          step: TENANT_PROVISIONING_STEP.SANITY_PROJECT,
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        }),
      );
      expect(finishProvisioningRun).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
      });
    });
  });

  it('never exposes the enqueue secret or internal error text', async () => {
    vi.mocked(start).mockRejectedValue(new Error(`leaked ${SECRET}`));

    const response = await POST(enqueueRequest());

    expect(await response.text()).not.toContain(SECRET);
  });
});
