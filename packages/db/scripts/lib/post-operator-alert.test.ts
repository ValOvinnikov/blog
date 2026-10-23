import {
  HTTP_STATUS,
  OPERATOR_ALERT_KIND,
  type TOperatorAlertBody,
} from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';

import { postOperatorAlert } from './post-operator-alert';

const STALLED_ELEVATION_ALERT: TOperatorAlertBody = {
  kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
  tenantId: 't1',
  outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
};

beforeEach(() => {
  vi.stubEnv('PLATFORM_APP_BASE_URL', 'https://platform.example.com');
  vi.stubEnv('OPERATOR_ALERT_SECRET', 'shared-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe(postOperatorAlert, () => {
  it('does not throw when the platform returns 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
        ),
    );

    await expect(
      postOperatorAlert(STALLED_ELEVATION_ALERT),
    ).resolves.toBeUndefined();
  });

  it('does not throw when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    await expect(
      postOperatorAlert(STALLED_ELEVATION_ALERT),
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

    it('sends the secret as a Bearer token', async () => {
      await postOperatorAlert(STALLED_ELEVATION_ALERT);

      const [, init] = fetchMock.mock.calls[0] as [
        URL,
        { headers: Record<string, string>; body: string },
      ];
      expect(init.headers['Authorization']).toBe('Bearer shared-secret');
      expect(JSON.parse(init.body)).toEqual(STALLED_ELEVATION_ALERT);
    });

    it('POSTs to /api/internal/operator-alert on the platform origin', async () => {
      await postOperatorAlert({
        kind: OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION,
        tenantId: 't1',
        invalidDocumentCount: 2,
        isCritical: true,
      });

      const [url] = fetchMock.mock.calls[0] as [URL];
      expect(url.toString()).toBe(
        'https://platform.example.com/api/internal/operator-alert',
      );
    });
  });

  describe('when the alert cannot be addressed', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
    });

    it('does not call fetch and resolves when PLATFORM_APP_BASE_URL is unset', async () => {
      vi.stubEnv('PLATFORM_APP_BASE_URL', undefined);

      await expect(
        postOperatorAlert(STALLED_ELEVATION_ALERT),
      ).resolves.toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not call fetch and resolves when OPERATOR_ALERT_SECRET is unset', async () => {
      vi.stubEnv('OPERATOR_ALERT_SECRET', undefined);

      await expect(
        postOperatorAlert(STALLED_ELEVATION_ALERT),
      ).resolves.toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not throw when PLATFORM_APP_BASE_URL is not a valid URL', async () => {
      vi.stubEnv('PLATFORM_APP_BASE_URL', 'not a url');

      await expect(
        postOperatorAlert(STALLED_ELEVATION_ALERT),
      ).resolves.toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
