import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import {
  isNotifiableOutcome,
  notifyOperatorsOfOwnerElevationOutcome,
} from './notify-operators';

function tenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 't1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj-acme',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: 'READY',
    provisioningSteps: null,
    studioVercelProjectId: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as TTenant;
}

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  originalEnv['PLATFORM_APP_URL'] = process.env['PLATFORM_APP_URL'];
  originalEnv['OPERATOR_ALERT_SECRET'] = process.env['OPERATOR_ALERT_SECRET'];
  process.env['PLATFORM_APP_URL'] = 'https://platform.example.com';
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

describe(isNotifiableOutcome, () => {
  it('is true for STALLED and AMBIGUOUS_MEMBERSHIP', () => {
    expect(isNotifiableOutcome('STALLED')).toBe(true);
    expect(isNotifiableOutcome('AMBIGUOUS_MEMBERSHIP')).toBe(true);
  });

  it('is false for ELEVATED, ALREADY_ADMINISTRATOR, PENDING_ACCEPTANCE', () => {
    expect(isNotifiableOutcome('ELEVATED')).toBe(false);
    expect(isNotifiableOutcome('ALREADY_ADMINISTRATOR')).toBe(false);
    expect(isNotifiableOutcome('PENDING_ACCEPTANCE')).toBe(false);
  });
});

describe(notifyOperatorsOfOwnerElevationOutcome, () => {
  it('posts an OWNER_ELEVATION alert with the tenant id and outcome', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await notifyOperatorsOfOwnerElevationOutcome({
      tenant: tenant(),
      outcome: 'STALLED',
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, { body: string }];
    expect(JSON.parse(init.body)).toEqual({
      kind: 'OWNER_ELEVATION',
      tenantId: 't1',
      outcome: 'STALLED',
    });
  });

  it('resolves without throwing when the platform responds with a failure status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    await expect(
      notifyOperatorsOfOwnerElevationOutcome({
        tenant: tenant(),
        outcome: 'STALLED',
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves without throwing when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    await expect(
      notifyOperatorsOfOwnerElevationOutcome({
        tenant: tenant(),
        outcome: 'AMBIGUOUS_MEMBERSHIP',
      }),
    ).resolves.toBeUndefined();
  });
});
