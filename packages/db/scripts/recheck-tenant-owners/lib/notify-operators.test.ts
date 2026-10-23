import type { TMaybeUndefined } from '@blog/config';
import {
  HTTP_STATUS,
  LOCALE_ISO_CODES,
  OPERATOR_ALERT_KIND,
} from '@blog/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import {
  isNotifiableOutcome,
  notifyOperatorsOfOwnerElevationOutcome,
} from './notify-operators';

const TENANT_TIMESTAMP = new Date('2026-01-01T00:00:00.000Z');

function tenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 't1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj-acme',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    provisioningSteps: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: TENANT_TIMESTAMP,
    updatedAt: TENANT_TIMESTAMP,
    ...overrides,
  } as TTenant;
}

const originalEnv: Record<string, TMaybeUndefined<string>> = {};

beforeEach(() => {
  originalEnv['PLATFORM_APP_BASE_URL'] = process.env['PLATFORM_APP_BASE_URL'];
  originalEnv['OPERATOR_ALERT_SECRET'] = process.env['OPERATOR_ALERT_SECRET'];
  process.env['PLATFORM_APP_BASE_URL'] = 'https://platform.example.com';
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
    expect(isNotifiableOutcome(ELEVATE_TENANT_OWNER_OUTCOME.STALLED)).toBe(
      true,
    );
    expect(
      isNotifiableOutcome(ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP),
    ).toBe(true);
  });

  it('is false for ELEVATED, ALREADY_ADMINISTRATOR, PENDING_ACCEPTANCE', () => {
    expect(isNotifiableOutcome(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED)).toBe(
      false,
    );
    expect(
      isNotifiableOutcome(ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR),
    ).toBe(false);
    expect(
      isNotifiableOutcome(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE),
    ).toBe(false);
  });
});

describe(notifyOperatorsOfOwnerElevationOutcome, () => {
  it('posts an OWNER_ELEVATION alert with the tenant id and outcome', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: HTTP_STATUS.OK }));
    vi.stubGlobal('fetch', fetchMock);

    await notifyOperatorsOfOwnerElevationOutcome({
      tenant: tenant(),
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, { body: string }];
    expect(JSON.parse(init.body)).toEqual({
      kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
      tenantId: 't1',
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
    });
  });

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
      notifyOperatorsOfOwnerElevationOutcome({
        tenant: tenant(),
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves without throwing when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    await expect(
      notifyOperatorsOfOwnerElevationOutcome({
        tenant: tenant(),
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
      }),
    ).resolves.toBeUndefined();
  });
});
