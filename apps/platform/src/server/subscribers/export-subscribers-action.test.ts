import { faker } from '@faker-js/faker';
import { SUBSCRIBERS_LOG } from '@platform/constants/subscribers';
import { requireSubscribersManager } from '@platform/server/subscribers/require-subscribers-manager';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockMembershipContext } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/tenant-identity';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME } from '@shinefold/config';

import { exportSubscribersAction } from './export-subscribers-action';

faker.seed(7164);

const { listSubscribersForExportMock, listTenantDomainsMock } = vi.hoisted(
  () => ({
    listSubscribersForExportMock: vi.fn(),
    listTenantDomainsMock: vi.fn(),
  }),
);

vi.mock('@platform/server/subscribers/require-subscribers-manager');
vi.mock('@platform/utils/env/env');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    subscribers: { listSubscribersForExport: listSubscribersForExportMock },
    tenantDomains: { listTenantDomains: listTenantDomainsMock },
  },
}));

const MOCK_EMAIL = faker.internet.email();
const MOCK_CONFIRMED_AT = new Date('2026-11-03T09:15:00.000Z');
const MOCK_NOW = new Date('2026-11-22T12:00:00.000Z');
const MOCK_CUSTOM_DOMAIN = faker.internet.domainName();

describe(exportSubscribersAction, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MOCK_NOW);
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    listSubscribersForExportMock.mockResolvedValue([
      { email: MOCK_EMAIL, confirmedAt: MOCK_CONFIRMED_AT },
    ]);
    listTenantDomainsMock.mockResolvedValue([
      { domain: MOCK_CUSTOM_DOMAIN },
      { domain: MOCK_TENANT_DOMAIN },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports every confirmed subscriber, named after the site's platform address", async () => {
    const result = await exportSubscribersAction(MOCK_TENANT_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      data: {
        fileName: `subscribers-${MOCK_TENANT_SLUG}-2026-11-22.csv`,
        csv: expect.stringContaining(
          `${MOCK_EMAIL},${MOCK_CONFIRMED_AT.toISOString()}`,
        ),
      },
    });
    expect(listSubscribersForExportMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
    );
  });

  it('names the file after the main address when the site has no platform address', async () => {
    listTenantDomainsMock.mockResolvedValue([{ domain: MOCK_CUSTOM_DOMAIN }]);
    vi.mocked(requireSubscribersManager).mockResolvedValueOnce(
      mockMembershipContext(
        mockReadyTenant({
          id: MOCK_TENANT_ID,
          primaryDomain: MOCK_CUSTOM_DOMAIN,
        }),
      ),
    );

    const result = await exportSubscribersAction(MOCK_TENANT_ID);
    const [label] = MOCK_CUSTOM_DOMAIN.split('.');

    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          fileName: `subscribers-${label}-2026-11-22.csv`,
        }),
      }),
    );
  });

  it('logs a failed export and reports a server error', async () => {
    listSubscribersForExportMock.mockRejectedValue(new Error());

    const result = await exportSubscribersAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      SUBSCRIBERS_LOG.EXPORT_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
