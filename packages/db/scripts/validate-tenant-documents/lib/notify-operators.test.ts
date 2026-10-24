import {
  FINDING_SEVERITY,
  HTTP_STATUS,
  OPERATOR_ALERT_KIND,
} from '@blog/config/constants';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';

import { notifyOperatorsOfDocumentValidationFailure } from './notify-operators';

const MOCK_TENANT = mockTenant();

beforeEach(() => {
  vi.stubEnv('PLATFORM_APP_BASE_URL', 'https://platform.example.com');
  vi.stubEnv('OPERATOR_ALERT_SECRET', 'shared-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe(notifyOperatorsOfDocumentValidationFailure, () => {
  it.each([
    [
      'the platform responds with a failure status',
      () =>
        vi
          .fn()
          .mockResolvedValue(
            new Response(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
          ),
    ],
    [
      'fetch itself rejects',
      () => vi.fn().mockRejectedValue(new Error('ECONNRESET')),
    ],
  ])('resolves without throwing when %s', async (_case, mockFetch) => {
    vi.stubGlobal('fetch', mockFetch());

    await expect(
      notifyOperatorsOfDocumentValidationFailure({
        tenant: MOCK_TENANT,
        invalidDocumentCount: 1,
        severity: FINDING_SEVERITY.CRITICAL,
      }),
    ).resolves.toBeUndefined();
  });

  it.each([
    [FINDING_SEVERITY.CRITICAL, true],
    [FINDING_SEVERITY.WARNING, false],
  ])(
    'posts a DOCUMENT_VALIDATION alert for %s severity with isCritical %s',
    async (severity, isCritical) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: HTTP_STATUS.OK }));
      vi.stubGlobal('fetch', fetchMock);

      await notifyOperatorsOfDocumentValidationFailure({
        tenant: MOCK_TENANT,
        invalidDocumentCount: 3,
        severity,
      });

      const [, init] = fetchMock.mock.calls[0] as [URL, { body: string }];
      expect(JSON.parse(init.body)).toEqual({
        kind: OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION,
        tenantId: MOCK_TENANT.id,
        invalidDocumentCount: 3,
        isCritical,
      });
    },
  );
});
