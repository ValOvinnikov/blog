import { OPERATOR_ALERT_KIND } from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import {
  MOCK_OPERATOR_ALERT_SECRET,
  MOCK_PLATFORM_APP_BASE_URL,
} from '@blog/db/testing/operator-alert/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import {
  isNotifiableOutcome,
  notifyOperatorsOfOwnerElevationOutcome,
} from './notify-operators';

faker.seed(5805);

const MOCK_TENANT = mockTenant();

beforeEach(() => {
  vi.stubEnv('PLATFORM_APP_BASE_URL', MOCK_PLATFORM_APP_BASE_URL);
  vi.stubEnv('OPERATOR_ALERT_SECRET', MOCK_OPERATOR_ALERT_SECRET);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(isNotifiableOutcome, () => {
  it.each([
    ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
    ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
  ])('is true for %s', (outcome) => {
    expect(isNotifiableOutcome(outcome)).toBe(true);
  });

  it.each([
    ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED,
    ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR,
    ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE,
  ])('is false for %s', (outcome) => {
    expect(isNotifiableOutcome(outcome)).toBe(false);
  });
});

describe(notifyOperatorsOfOwnerElevationOutcome, () => {
  it('posts an OWNER_ELEVATION alert with the tenant id and outcome', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));
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
});
