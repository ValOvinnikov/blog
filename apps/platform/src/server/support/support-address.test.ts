import { faker } from '@faker-js/faker';
import { SUPPORT_LOG } from '@platform/constants/support';
import { mockedSupportEnv } from '@platform/testing/env/mocked-support-env';
import { logger } from '@platform/utils/logger/logger';

import { resolveSupportAddress } from './support-address';

vi.mock('@platform/utils/support-env/support-env');

faker.seed(7184);

const MOCK_SUPPORT_ADDRESS = faker.internet.email();

describe(resolveSupportAddress, () => {
  it('returns the configured address without logging', () => {
    mockedSupportEnv.SUPPORT_EMAIL_ADDRESS = MOCK_SUPPORT_ADDRESS;

    expect(resolveSupportAddress()).toBe(MOCK_SUPPORT_ADDRESS);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a missing address once, however often it is read', () => {
    mockedSupportEnv.SUPPORT_EMAIL_ADDRESS = undefined;

    resolveSupportAddress();
    const address = resolveSupportAddress();

    expect(address).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(SUPPORT_LOG.ADDRESS_MISSING);
  });
});
