import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import {
  arrangeSignedWritableTenant,
  MOCK_SUSPENDED_WRITABLE_TENANT,
} from '@worker/testing/signed-tenant-request/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { tenantRequestBodySchema } from '@worker/utils/signed-tenant-request/signed-tenant-request';

import { handleSignedTenantRequest } from './handle-signed-tenant-request';

const MOCK_URL = `${MOCK_WORKER_ORIGIN}/api/signed-tenant`;
const MOCK_BODY = JSON.stringify({ tenantId: MOCK_TENANT_ID });
const MOCK_FAILURE_EVENT = 'signed_tenant.failed';

vi.mock('@worker/utils/env/env');
vi.mock('@shinefold/db/queries/tenants');

const run = vi.fn<(body: { tenantId: string }) => Promise<Response>>();

function handle(
  request: Request = mockSignedRequest(MOCK_URL, MOCK_BODY, {
    secret: MOCK_ENQUEUE_SECRET,
  }),
  requiresWritableStatus = false,
): Promise<Response> {
  return handleSignedTenantRequest(request, {
    schema: tenantRequestBodySchema,
    failureEvent: MOCK_FAILURE_EVENT,
    refusal: { requiresWritableStatus },
    run,
  });
}

describe('handleSignedTenantRequest', () => {
  beforeEach(() => {
    arrangeSignedWritableTenant();
    run.mockResolvedValue(Response.json({}, { status: HTTP_STATUS.ACCEPTED }));
  });

  it('runs the work for the signed tenant and answers with its response', async () => {
    const response = await handle();

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    expect(run).toHaveBeenCalledExactlyOnceWith({ tenantId: MOCK_TENANT_ID });
  });

  it.each([
    {
      name: 'an unsigned request',
      request: () =>
        new Request(MOCK_URL, { method: HTTP_METHOD.POST, body: MOCK_BODY }),
      status: HTTP_STATUS.UNAUTHORIZED,
      error: ENQUEUE_ERROR.UNAUTHORIZED,
    },
    {
      name: 'a request signed with the wrong secret',
      request: () =>
        mockSignedRequest(MOCK_URL, MOCK_BODY, { secret: MOCK_FORGED_SECRET }),
      status: HTTP_STATUS.UNAUTHORIZED,
      error: ENQUEUE_ERROR.UNAUTHORIZED,
    },
    {
      name: 'a body without a tenant id',
      request: () =>
        mockSignedRequest(MOCK_URL, JSON.stringify({}), {
          secret: MOCK_ENQUEUE_SECRET,
        }),
      status: HTTP_STATUS.BAD_REQUEST,
      error: ENQUEUE_ERROR.INVALID_BODY,
    },
  ])('refuses $name', async ({ request, status, error }) => {
    const response = await handle(request());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error });
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'not found for an unknown or archived tenant',
      tenant: undefined,
      status: HTTP_STATUS.NOT_FOUND,
      error: ENQUEUE_ERROR.NOT_FOUND,
    },
    {
      name: 'a conflict when the tenant has no Sanity write token yet',
      tenant: mockProvisionedTenant(),
      status: HTTP_STATUS.CONFLICT,
      error: ENQUEUE_ERROR.NOT_PROVISIONED,
    },
  ])('answers $name', async ({ tenant, status, error }) => {
    vi.mocked(getTenantById).mockResolvedValue(tenant);

    const response = await handle();

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error });
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    { requiresWritableStatus: false, status: HTTP_STATUS.ACCEPTED },
    { requiresWritableStatus: true, status: HTTP_STATUS.CONFLICT },
  ])(
    'answers $status for a suspended tenant when requiring writable: $requiresWritableStatus',
    async ({ requiresWritableStatus, status }) => {
      vi.mocked(getTenantById).mockResolvedValue(
        MOCK_SUSPENDED_WRITABLE_TENANT,
      );

      const response = await handle(undefined, requiresWritableStatus);

      expect(response.status).toBe(status);
    },
  );

  it('logs the body and answers a server error when the work throws', async () => {
    run.mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await handle();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(MOCK_FAILURE_EVENT, {
      tenantId: MOCK_TENANT_ID,
      error: MOCK_QUEUE_DOWN,
    });
  });
});
