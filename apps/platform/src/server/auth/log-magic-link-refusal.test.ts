import { MAGIC_LINK_REFUSAL } from '@blog/config/constants';
import { SIGN_IN_LOG } from '@platform/constants/sign-in';
import { logger } from '@platform/utils/logger/logger';

import { logMagicLinkRefusal } from './log-magic-link-refusal';

const ERROR_NAME = 'DrizzleQueryError';
const POSTGRES_ERROR_CODE = '57P01';

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

  it('carries the error name and code of a failed check', () => {
    const refusal = {
      reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
      errorName: ERROR_NAME,
      errorCode: POSTGRES_ERROR_CODE,
    };

    logMagicLinkRefusal(refusal);

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      SIGN_IN_LOG.LINK_REFUSED,
      refusal,
    );
  });
});
