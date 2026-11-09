import {
  HTTP_METHOD,
  HTTP_STATUS,
  LOCALE_ISO_CODES,
} from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { COOKIE_STATEMENT_LOG } from '@worker/constants/cookie-statement';
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
  MOCK_ENCRYPTED_TOKEN,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { seedCookieStatements } from '@worker/workflows/seed-cookie-statements';
import { start } from 'workflow/api';

import { POST } from './route';

const MOCK_SEED_URL = `${MOCK_WORKER_ORIGIN}/api/cookie-statement/seed`;
const MOCK_LOCALES = [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.FR];

vi.mock('@worker/utils/env/env');
vi.mock('@worker/workflows/seed-cookie-statements');
vi.mock('workflow/api');
vi.mock('@blog/db/queries/tenants');

function seedRequest(
  body: Record<string, unknown> = {
    tenantId: MOCK_TENANT_ID,
    locales: MOCK_LOCALES,
  },
  secret: string = MOCK_ENQUEUE_SECRET,
): Request {
  return mockSignedRequest(MOCK_SEED_URL, JSON.stringify(body), { secret });
}

describe('POST /api/cookie-statement/seed', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(
      mockProvisionedTenant({
        sanityWriteTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
      }),
    );
    vi.mocked(start).mockResolvedValue({ runId: MOCK_RUN_ID } as never);
  });

  it('starts the seed run once per locale and answers with its id', async () => {
    const response = await POST(
      seedRequest({
        tenantId: MOCK_TENANT_ID,
        locales: [...MOCK_LOCALES, LOCALE_ISO_CODES.NL],
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    await expect(response.json()).resolves.toEqual({ runId: MOCK_RUN_ID });
    expect(start).toHaveBeenCalledWith(seedCookieStatements, [
      MOCK_TENANT_ID,
      MOCK_LOCALES,
    ]);
  });

  it('refuses an unsigned request', async () => {
    const response = await POST(
      new Request(MOCK_SEED_URL, {
        method: HTTP_METHOD.POST,
        body: JSON.stringify({
          tenantId: MOCK_TENANT_ID,
          locales: MOCK_LOCALES,
        }),
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it('refuses a request signed with the wrong secret', async () => {
    const response = await POST(seedRequest(undefined, MOCK_FORGED_SECRET));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it.each([
    { tenantId: MOCK_TENANT_ID },
    { tenantId: MOCK_TENANT_ID, locales: [] },
    { tenantId: MOCK_TENANT_ID, locales: ['XX'] },
  ])('refuses a malformed body %j', async (body) => {
    const response = await POST(seedRequest(body));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.INVALID_BODY,
    });
  });

  it('answers not found for an unknown or archived tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    const response = await POST(seedRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers a conflict when the tenant has no seeded Sanity project yet', async () => {
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());

    const response = await POST(seedRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.NOT_PROVISIONED,
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('logs and answers a server error when the run cannot be started', async () => {
    vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await POST(seedRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      COOKIE_STATEMENT_LOG.SEED_START_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        locales: MOCK_LOCALES,
        error: MOCK_QUEUE_DOWN,
      },
    );
  });
});
