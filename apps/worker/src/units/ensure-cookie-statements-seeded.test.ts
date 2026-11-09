import { buildStarterCookieStatement } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import { getTenantSanityWriteCredentials } from '@blog/db/queries/tenants';
import { COOKIE_STATEMENT_LOG } from '@worker/constants/cookie-statement';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
} from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { logger } from '@worker/utils/logger/logger';
import { createClientWithTimeout } from '@worker/utils/step-deps/step-deps';

import { ensureCookieStatementsSeeded } from './ensure-cookie-statements-seeded';

vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/step-deps/step-deps');
vi.mock('workflow');

const MOCK_WRITE_TOKEN = 'sk-write';
const MOCK_LOCALES = [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.DE];

const createIfNotExists = vi.fn();
const commit = vi.fn();

describe(ensureCookieStatementsSeeded, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(getTenantSanityWriteCredentials).mockResolvedValue({
      projectId: MOCK_SANITY_PROJECT_ID,
      dataset: MOCK_SANITY_DATASET,
      token: MOCK_WRITE_TOKEN,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });
    commit.mockResolvedValue({});
    vi.mocked(createClientWithTimeout).mockReturnValue({
      transaction: () => ({ createIfNotExists, commit }),
    } as never);
  });

  it('creates the starter cookie statement for each locale in one commit, only where missing', async () => {
    await ensureCookieStatementsSeeded(MOCK_TENANT_ID, MOCK_LOCALES);

    expect(createClientWithTimeout).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: MOCK_SANITY_PROJECT_ID,
        dataset: MOCK_SANITY_DATASET,
        token: MOCK_WRITE_TOKEN,
        useCdn: false,
      }),
    );
    expect(createIfNotExists.mock.calls).toEqual(
      MOCK_LOCALES.map((locale) => [buildStarterCookieStatement(locale)]),
    );
    expect(commit).toHaveBeenCalledOnce();
  });

  it('fails for good without writing when the tenant has no write credentials', async () => {
    vi.mocked(getTenantSanityWriteCredentials).mockResolvedValue(undefined);

    await expect(
      ensureCookieStatementsSeeded(MOCK_TENANT_ID, MOCK_LOCALES),
    ).rejects.toThrow();

    expect(createClientWithTimeout).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      COOKIE_STATEMENT_LOG.SEED_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('rethrows a transient failure silently before the final attempt', async () => {
    commit.mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(
      ensureCookieStatementsSeeded(MOCK_TENANT_ID, MOCK_LOCALES),
    ).rejects.toThrow(MOCK_SANITY_OUTAGE);

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a failure once its retries are spent', async () => {
    atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
    commit.mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(
      ensureCookieStatementsSeeded(MOCK_TENANT_ID, MOCK_LOCALES),
    ).rejects.toThrow(MOCK_SANITY_OUTAGE);

    expect(logger.error).toHaveBeenCalledWith(
      COOKIE_STATEMENT_LOG.SEED_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        locales: MOCK_LOCALES,
        error: MOCK_SANITY_OUTAGE,
      },
    );
  });
});
