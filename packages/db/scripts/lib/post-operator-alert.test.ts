import {
  HTTP_STATUS,
  OPERATOR_ALERT_KIND,
  type TOperatorAlertBody,
} from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import {
  MOCK_OPERATOR_ALERT_SECRET,
  MOCK_PLATFORM_APP_BASE_URL,
} from '@blog/db/testing/operator-alert/fixtures';
import { faker } from '@faker-js/faker';

import { postOperatorAlert } from './post-operator-alert';

faker.seed(5801);

const MOCK_TENANT_ID = faker.string.uuid();
const MOCK_INVALID_DOCUMENT_COUNT = faker.number.int({ min: 2, max: 9 });
const MOCK_NETWORK_ERROR = faker.lorem.sentence();
const MOCK_INVALID_BASE_URL = faker.lorem.words(3);
const OPERATOR_ALERT_PATH = '/api/internal/operator-alert';

const MOCK_STALLED_ELEVATION_ALERT: TOperatorAlertBody = {
  kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
  tenantId: MOCK_TENANT_ID,
  outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
};

const MOCK_DOCUMENT_VALIDATION_ALERT: TOperatorAlertBody = {
  kind: OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION,
  tenantId: MOCK_TENANT_ID,
  invalidDocumentCount: MOCK_INVALID_DOCUMENT_COUNT,
  isCritical: true,
};

beforeEach(() => {
  vi.stubEnv('PLATFORM_APP_BASE_URL', MOCK_PLATFORM_APP_BASE_URL);
  vi.stubEnv('OPERATOR_ALERT_SECRET', MOCK_OPERATOR_ALERT_SECRET);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(postOperatorAlert, () => {
  it('does not throw when the platform responds with a failure status', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
        ),
    );

    await expect(
      postOperatorAlert(MOCK_STALLED_ELEVATION_ALERT),
    ).resolves.toBeUndefined();
  });

  it('does not throw when fetch itself rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error(MOCK_NETWORK_ERROR)),
    );

    await expect(
      postOperatorAlert(MOCK_STALLED_ELEVATION_ALERT),
    ).resolves.toBeUndefined();
  });

  describe('when the platform accepts the alert', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: HTTP_STATUS.OK }));
      vi.stubGlobal('fetch', fetchMock);
    });

    it('sends the secret as a Bearer token with the alert as the body', async () => {
      await postOperatorAlert(MOCK_STALLED_ELEVATION_ALERT);

      const [, init] = fetchMock.mock.calls[0] as [
        URL,
        { headers: Record<string, string>; body: string },
      ];
      const { headers, body } = init;
      expect(headers['Authorization']).toBe(
        `Bearer ${MOCK_OPERATOR_ALERT_SECRET}`,
      );
      expect(JSON.parse(body)).toEqual(MOCK_STALLED_ELEVATION_ALERT);
    });

    it('POSTs to the operator-alert path on the platform origin', async () => {
      await postOperatorAlert(MOCK_DOCUMENT_VALIDATION_ALERT);

      const [url] = fetchMock.mock.calls[0] as [URL];
      expect(url.toString()).toBe(
        `${MOCK_PLATFORM_APP_BASE_URL}${OPERATOR_ALERT_PATH}`,
      );
    });
  });

  describe('when the alert cannot be addressed', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
    });

    it.each(['PLATFORM_APP_BASE_URL', 'OPERATOR_ALERT_SECRET'])(
      'skips fetch and resolves when %s is unset',
      async (unsetVar) => {
        vi.stubEnv(unsetVar, undefined);

        await expect(
          postOperatorAlert(MOCK_STALLED_ELEVATION_ALERT),
        ).resolves.toBeUndefined();
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it('skips fetch and resolves when the base URL is not a valid URL', async () => {
      vi.stubEnv('PLATFORM_APP_BASE_URL', MOCK_INVALID_BASE_URL);

      await expect(
        postOperatorAlert(MOCK_STALLED_ELEVATION_ALERT),
      ).resolves.toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
