import {
  FINDING_SEVERITY,
  HTTP_STATUS,
  OPERATOR_ALERT_KIND,
} from '@blog/config/constants';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { notifyOperatorsOfDocumentValidationFailure } from './notify-operators';

faker.seed(5802);

const MOCK_TENANT = mockTenant();
const MOCK_PLATFORM_URL = faker.internet.url({ appendSlash: false });
const MOCK_ALERT_SECRET = faker.string.alphanumeric(24);
const MOCK_INVALID_DOCUMENT_COUNT = faker.number.int({ min: 2, max: 9 });

beforeEach(() => {
  vi.stubEnv('PLATFORM_APP_BASE_URL', MOCK_PLATFORM_URL);
  vi.stubEnv('OPERATOR_ALERT_SECRET', MOCK_ALERT_SECRET);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(notifyOperatorsOfDocumentValidationFailure, () => {
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
        invalidDocumentCount: MOCK_INVALID_DOCUMENT_COUNT,
        severity,
      });

      const [, init] = fetchMock.mock.calls[0] as [URL, { body: string }];
      expect(JSON.parse(init.body)).toEqual({
        kind: OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION,
        tenantId: MOCK_TENANT.id,
        invalidDocumentCount: MOCK_INVALID_DOCUMENT_COUNT,
        isCritical,
      });
    },
  );
});
