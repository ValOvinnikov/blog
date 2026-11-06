import { TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { FOOTER_LOG } from '@web/constants/footer';
import { getEffectivePlan } from '@web/server/site-config/get-effective-plan/get-effective-plan';
import { setMockEnv } from '@web/testing/server/infra/set-mock-env';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getPoweredByMark } from './get-powered-by-mark';

vi.mock('@web/server/site-config/get-effective-plan/get-effective-plan');
vi.mock('@web/utils/env/env');

faker.seed(6796);

const MOCK_PRODUCT_NAME = faker.company.name();
const MOCK_MARKETING_SITE_URL = faker.internet.url();

const getEffectivePlanMock = vi.mocked(getEffectivePlan);

describe(getPoweredByMark, () => {
  beforeEach(() => {
    setMockEnv({
      PRODUCT_NAME: MOCK_PRODUCT_NAME,
      MARKETING_SITE_URL: MOCK_MARKETING_SITE_URL,
    });
  });

  it('returns the product name and marketing site on a Free site', async () => {
    getEffectivePlanMock.mockResolvedValueOnce(TENANT_PLAN.FREE);

    await expect(getPoweredByMark(MOCK_TENANT_ID)).resolves.toEqual({
      productName: MOCK_PRODUCT_NAME,
      href: MOCK_MARKETING_SITE_URL,
    });
    expect(getEffectivePlanMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('returns no mark on a Growth site', async () => {
    getEffectivePlanMock.mockResolvedValueOnce(TENANT_PLAN.GROWTH);

    await expect(getPoweredByMark(MOCK_TENANT_ID)).resolves.toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each([
    [
      'the product name',
      { MARKETING_SITE_URL: MOCK_MARKETING_SITE_URL },
      { hasProductName: false, hasMarketingSiteUrl: true },
    ],
    [
      'the marketing site address',
      { PRODUCT_NAME: MOCK_PRODUCT_NAME },
      { hasProductName: true, hasMarketingSiteUrl: false },
    ],
  ])(
    'returns no mark on a Free site and logs when %s is unset',
    async (_, values, context) => {
      setMockEnv(values);
      getEffectivePlanMock.mockResolvedValueOnce(TENANT_PLAN.FREE);

      await expect(getPoweredByMark(MOCK_TENANT_ID)).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        FOOTER_LOG.POWERED_BY_UNCONFIGURED,
        context,
      );
    },
  );
});
