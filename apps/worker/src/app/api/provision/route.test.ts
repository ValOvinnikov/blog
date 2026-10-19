import { createHmac } from 'node:crypto';

import { ERROR_CODE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import {
  beginTenantProvisioning,
  finishProvisioningRun,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { start } from 'workflow/api';

import { POST } from './route';

const SECRET = 'enqueue-secret';
const TENANT_ID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';

const mockEnv = vi.hoisted(() => ({
  WORKER_ENQUEUE_SECRET: 'enqueue-secret' as string | undefined,
}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));
vi.mock('@worker/utils/logger/logger');
vi.mock('@worker/workflows/provision-tenant', () => ({
  provisionTenant: vi.fn(),
}));
vi.mock('workflow/api', () => ({ start: vi.fn() }));
vi.mock('@blog/db/queries/tenants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/db/queries/tenants')>()),
  beginTenantProvisioning: vi.fn(),
  updateProvisioningStep: vi.fn(),
  finishProvisioningRun: vi.fn(),
}));

function makeTenant(): TTenant {
  return {
    id: TENANT_ID,
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    additionalLocales: [],
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: null,
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    deprovisioningSteps: null,
    siteType: null,
    siteTemplateVersion: null,
    ownerSanityInviteId: null,
    ownerInviteSentAt: null,
    ownerInviteAcceptedAt: null,
    ownerSanityUserId: null,
    ownerLoginProvider: null,
    ownerSanityRole: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

function signedRequest(
  rawBody: string,
  overrides: { secret?: string; timestamp?: number } = {},
): Request {
  const { secret = SECRET, timestamp = Date.now() } = overrides;
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return new Request('https://worker.example.com/api/provision', {
    method: 'POST',
    headers: {
      'x-worker-timestamp': String(timestamp),
      'x-worker-signature': `sha256=${digest}`,
    },
    body: rawBody,
  });
}

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
        new Request('https://worker.example.com/api/provision', {
          method: 'POST',
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
        new Request('https://worker.example.com/api/provision', {
          method: 'POST',
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

    expect(response.status).toBe(401);
    expect(beginTenantProvisioning).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 401 when the enqueue secret is not configured', async () => {
    mockEnv.WORKER_ENQUEUE_SECRET = undefined;

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(401);
  });

  it('answers 400 for a body that is not JSON', async () => {
    const response = await POST(signedRequest('not json'));

    expect(response.status).toBe(400);
    expect(start).not.toHaveBeenCalled();
  });

  it.each([
    ['a non-uuid tenant id', { tenantId: 'tenant-1' }],
    ['a missing tenant id', {}],
  ])('answers 400 for %s', async (_label, body) => {
    const response = await POST(signedRequest(JSON.stringify(body)));

    expect(response.status).toBe(400);
    expect(beginTenantProvisioning).not.toHaveBeenCalled();
  });

  it('answers 409 and starts no run while one is already in progress', async () => {
    vi.mocked(beginTenantProvisioning).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(409);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 404 for a tenant that does not exist', async () => {
    vi.mocked(beginTenantProvisioning).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(404);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 500 when the guard fails for another reason', async () => {
    vi.mocked(beginTenantProvisioning).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_DUPLICATE_DOMAIN,
    });

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(500);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 500 when the guard query throws', async () => {
    vi.mocked(beginTenantProvisioning).mockRejectedValue(new Error('boom'));

    const response = await POST(enqueueRequest());

    expect(response.status).toBe(500);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers 202 with the run id once the run is started', async () => {
    const response = await POST(enqueueRequest());

    expect(response.status).toBe(202);
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

      expect(response.status).toBe(500);
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
