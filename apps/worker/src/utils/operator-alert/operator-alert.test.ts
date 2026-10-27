import {
  HTTP_METHOD,
  HTTP_STATUS,
  OPERATOR_ALERT_KIND,
} from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';

import { postOperatorAlert } from './operator-alert';

const { platformAppBaseUrl } = MOCK_PROVISION_ENV;

const ALERT = {
  kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
  tenantId: MOCK_TENANT_ID,
  outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
} as const;

faker.seed(6025);

vi.mock('@worker/utils/env/env');

const MOCK_ALERT_SECRET = faker.string.alphanumeric(32);

const fetchMock = vi.fn();

describe(postOperatorAlert, () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    mockEnv.PLATFORM_APP_BASE_URL = platformAppBaseUrl;
    mockEnv.OPERATOR_ALERT_SECRET = MOCK_ALERT_SECRET;
    fetchMock.mockResolvedValue(new Response('{}', { status: HTTP_STATUS.OK }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the alert to the platform's operator-alert route", async () => {
    await expect(postOperatorAlert(ALERT)).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toBe(
      `${platformAppBaseUrl}/api/internal/operator-alert`,
    );
    expect(init.method).toBe(HTTP_METHOD.POST);
    expect(new Headers(init.headers).get('Authorization')).toBe(
      `Bearer ${MOCK_ALERT_SECRET}`,
    );
    expect(JSON.parse(String(init.body))).toEqual(ALERT);
  });

  it('reports the alert unsent when the platform rejects it', async () => {
    fetchMock.mockResolvedValue(
      new Response('', { status: HTTP_STATUS.UNAUTHORIZED }),
    );

    await expect(postOperatorAlert(ALERT)).resolves.toBe(false);
    const [event, context] = vi.mocked(logger.error).mock.lastCall ?? [];
    expect(event).toBe('operator_alert.rejected');
    expect(context?.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it('reports the alert unsent without throwing when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    await expect(postOperatorAlert(ALERT)).resolves.toBe(false);
  });

  it('sends nothing when the alert secret is not configured', async () => {
    mockEnv.OPERATOR_ALERT_SECRET = undefined;

    await expect(postOperatorAlert(ALERT)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
