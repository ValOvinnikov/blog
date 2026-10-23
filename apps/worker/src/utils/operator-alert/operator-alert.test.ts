import type { TMaybeUndefined } from '@blog/config';
import {
  HTTP_METHOD,
  HTTP_STATUS,
  OPERATOR_ALERT_KIND,
} from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { postOperatorAlert } from './operator-alert';

const { platformAppBaseUrl } = MOCK_PROVISION_ENV;

const ALERT = {
  kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
  tenantId: MOCK_TENANT_ID,
  outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
} as const;

const mockEnv = vi.hoisted((): Record<string, TMaybeUndefined<string>> => ({}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));

const fetchMock = vi.fn();

describe(postOperatorAlert, () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    mockEnv.PLATFORM_APP_BASE_URL = platformAppBaseUrl;
    mockEnv.OPERATOR_ALERT_SECRET = 'alert-secret';
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
    expect(init.headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer alert-secret' }),
    );
    expect(JSON.parse(String(init.body))).toEqual(ALERT);
  });

  it('reports the alert unsent when the platform rejects it', async () => {
    fetchMock.mockResolvedValue(
      new Response('', { status: HTTP_STATUS.UNAUTHORIZED }),
    );

    await expect(postOperatorAlert(ALERT)).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      'operator_alert.rejected',
      expect.objectContaining({ status: HTTP_STATUS.UNAUTHORIZED }),
    );
  });

  it('reports the alert unsent without throwing when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));

    await expect(postOperatorAlert(ALERT)).resolves.toBe(false);
  });

  it('sends nothing when the alert secret is not configured', async () => {
    mockEnv.OPERATOR_ALERT_SECRET = undefined;

    await expect(postOperatorAlert(ALERT)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
