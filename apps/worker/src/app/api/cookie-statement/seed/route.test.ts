import { HTTP_STATUS, LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { COOKIE_STATEMENT_LOG } from '@worker/constants/cookie-statement';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import {
  arrangeSignedWritableTenant,
  MOCK_SUSPENDED_WRITABLE_TENANT,
} from '@worker/testing/signed-tenant-request/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { seedCookieStatements } from '@worker/workflows/seed-cookie-statements';
import { start } from 'workflow/api';

import { POST } from './route';

const MOCK_LOCALES = [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.FR];
const MOCK_BODY = { tenantId: MOCK_TENANT_ID, locales: MOCK_LOCALES };

vi.mock('@worker/utils/env/env');
vi.mock('@worker/workflows/seed-cookie-statements');
vi.mock('workflow/api');
vi.mock('@shinefold/db/queries/tenants');

function seedRequest(body: Record<string, unknown> = MOCK_BODY): Request {
  return mockSignedRequest(
    `${MOCK_WORKER_ORIGIN}/api/cookie-statement/seed`,
    JSON.stringify(body),
    { secret: MOCK_ENQUEUE_SECRET },
  );
}

describe('POST /api/cookie-statement/seed', () => {
  beforeEach(() => {
    arrangeSignedWritableTenant();
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

  it('starts the seed run for a suspended tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(MOCK_SUSPENDED_WRITABLE_TENANT);

    const response = await POST(seedRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
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

  it('logs the seed start failure with the locales when the run cannot be started', async () => {
    vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    await POST(seedRequest());

    expect(logger.error).toHaveBeenCalledWith(
      COOKIE_STATEMENT_LOG.SEED_START_FAILED,
      { ...MOCK_BODY, error: MOCK_QUEUE_DOWN },
    );
  });
});
