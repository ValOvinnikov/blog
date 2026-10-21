import {
  FINDING_SEVERITY,
  HTTP_STATUS,
  OPERATOR_ALERT_KIND,
} from '@blog/config/constants';
import { makeTenant } from '@blog/db/testing/tenants/fixtures';

import { notifyOperatorsOfDocumentValidationFailure } from './notify-operators';

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  originalEnv['ADMIN_APP_BASE_URL'] = process.env['ADMIN_APP_BASE_URL'];
  originalEnv['OPERATOR_ALERT_SECRET'] = process.env['OPERATOR_ALERT_SECRET'];
  process.env['ADMIN_APP_BASE_URL'] = 'https://platform.example.com';
  process.env['OPERATOR_ALERT_SECRET'] = 'shared-secret';
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  vi.unstubAllGlobals();
});

const tenant = makeTenant();

describe(notifyOperatorsOfDocumentValidationFailure, () => {
  it('resolves without throwing when the platform responds with a failure status', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
        ),
    );

    await expect(
      notifyOperatorsOfDocumentValidationFailure({
        tenant,
        invalidDocumentCount: 1,
        severity: FINDING_SEVERITY.WARNING,
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves without throwing when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    await expect(
      notifyOperatorsOfDocumentValidationFailure({
        tenant,
        invalidDocumentCount: 1,
        severity: FINDING_SEVERITY.CRITICAL,
      }),
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

    it('posts a DOCUMENT_VALIDATION alert with isCritical true for CRITICAL severity', async () => {
      await notifyOperatorsOfDocumentValidationFailure({
        tenant,
        invalidDocumentCount: 3,
        severity: FINDING_SEVERITY.CRITICAL,
      });

      const [, init] = fetchMock.mock.calls[0] as [URL, { body: string }];
      expect(JSON.parse(init.body)).toEqual({
        kind: OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION,
        tenantId: tenant.id,
        invalidDocumentCount: 3,
        isCritical: true,
      });
    });

    it('posts isCritical false for WARNING severity', async () => {
      await notifyOperatorsOfDocumentValidationFailure({
        tenant,
        invalidDocumentCount: 1,
        severity: FINDING_SEVERITY.WARNING,
      });

      const [, init] = fetchMock.mock.calls[0] as [URL, { body: string }];
      expect(JSON.parse(init.body)).toMatchObject({ isCritical: false });
    });
  });
});
