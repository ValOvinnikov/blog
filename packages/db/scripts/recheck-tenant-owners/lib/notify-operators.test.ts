import { HTTP_STATUS, OPERATOR_ALERT_KIND } from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';

import {
  isNotifiableOutcome,
  notifyOperatorsOfOwnerElevationOutcome,
} from './notify-operators';

const MOCK_TENANT = mockTenant();

beforeEach(() => {
  vi.stubEnv('PLATFORM_APP_BASE_URL', 'https://platform.example.com');
  vi.stubEnv('OPERATOR_ALERT_SECRET', 'shared-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
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
      tenant: MOCK_TENANT,
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, { body: string }];
    expect(JSON.parse(init.body)).toEqual({
      kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
      tenantId: MOCK_TENANT.id,
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
        tenant: MOCK_TENANT,
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves without throwing when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    await expect(
      notifyOperatorsOfOwnerElevationOutcome({
        tenant: MOCK_TENANT,
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
      }),
    ).resolves.toBeUndefined();
  });
});
