import { MAGIC_LINK_REFUSAL } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { SIGN_IN_LOG } from '@web/constants/sign-in';
import { logger } from '@web/utils/logger/logger';

import { logMagicLinkRefusal } from './log-magic-link-refusal';

faker.seed(5952);

const MOCK_ERROR_NAME = 'DrizzleQueryError';
const MOCK_POSTGRES_ERROR_CODE = '57P01';
const MOCK_ADDRESS = faker.internet.email();
const MOCK_COUNTER_KEY_HASH = faker.string.hexadecimal({
  length: 64,
  casing: 'lower',
  prefix: '',
});
const MOCK_LEAK = `${MOCK_ADDRESS} ${MOCK_COUNTER_KEY_HASH}`;

describe(logMagicLinkRefusal, () => {
  it.each(Object.values(MAGIC_LINK_REFUSAL))(
    'logs one warn line naming a %s refusal',
    (reason) => {
      logMagicLinkRefusal({ reason });

      expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
        SIGN_IN_LOG.LINK_REFUSED,
        { reason, errorName: undefined, errorCode: undefined },
      );
    },
  );

  it("logs a failed check's error name and code but none of its raw text", () => {
    const refusal = {
      reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
      errorName: MOCK_ERROR_NAME,
      errorCode: MOCK_POSTGRES_ERROR_CODE,
      message: `Failed query: insert … params: ${MOCK_LEAK}`,
      cause: { message: `terminating connection: ${MOCK_LEAK}` },
      detail: MOCK_LEAK,
    };

    logMagicLinkRefusal(refusal);

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      SIGN_IN_LOG.LINK_REFUSED,
      {
        reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
        errorName: MOCK_ERROR_NAME,
        errorCode: MOCK_POSTGRES_ERROR_CODE,
      },
    );
  });
});
