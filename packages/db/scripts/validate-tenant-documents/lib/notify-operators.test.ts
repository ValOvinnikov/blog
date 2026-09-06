import { FINDING_SEVERITY } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { notifyOperatorsOfDocumentValidationFailure } from './notify-operators';

function tenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 't1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj-acme',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: 'READY',
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    deprovisioningSteps: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

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

describe(notifyOperatorsOfDocumentValidationFailure, () => {
  it('posts a DOCUMENT_VALIDATION alert with isCritical true for CRITICAL severity', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await notifyOperatorsOfDocumentValidationFailure({
      tenant: tenant(),
      invalidDocumentCount: 3,
      severity: FINDING_SEVERITY.CRITICAL,
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, { body: string }];
    expect(JSON.parse(init.body)).toEqual({
      kind: 'DOCUMENT_VALIDATION',
      tenantId: 't1',
      invalidDocumentCount: 3,
      isCritical: true,
    });
  });

  it('posts isCritical false for WARNING severity', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await notifyOperatorsOfDocumentValidationFailure({
      tenant: tenant(),
      invalidDocumentCount: 1,
      severity: FINDING_SEVERITY.WARNING,
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, { body: string }];
    expect(JSON.parse(init.body)).toMatchObject({ isCritical: false });
  });

  it('resolves without throwing when the platform responds with a failure status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    await expect(
      notifyOperatorsOfDocumentValidationFailure({
        tenant: tenant(),
        invalidDocumentCount: 1,
        severity: FINDING_SEVERITY.WARNING,
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves without throwing when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    await expect(
      notifyOperatorsOfDocumentValidationFailure({
        tenant: tenant(),
        invalidDocumentCount: 1,
        severity: FINDING_SEVERITY.CRITICAL,
      }),
    ).resolves.toBeUndefined();
  });
});
