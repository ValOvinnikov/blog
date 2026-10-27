import { MAGIC_LINK_REFUSAL } from '@blog/config/constants';
import { SIGN_IN_LOG } from '@platform/constants/sign-in';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { MOCK_BLOCKED_ADDRESS_HASH } from '@platform/testing/blocked-signups/fixtures';
import {
  MOCK_POSTGRES_ERROR_CODE,
  MOCK_QUERY_ERROR_NAME,
  mockQueryError,
} from '@platform/testing/loggable-error/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { logMagicLinkRefusal } from './log-magic-link-refusal';

const MOCK_CHECK_FAILURE = {
  reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
  errorName: MOCK_QUERY_ERROR_NAME,
  errorCode: MOCK_POSTGRES_ERROR_CODE,
};

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
    logMagicLinkRefusal(MOCK_CHECK_FAILURE);

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      SIGN_IN_LOG.LINK_REFUSED,
      MOCK_CHECK_FAILURE,
    );
  });

  it('logs no message, detail, address or hash a refusal carries', () => {
    const refusal = Object.assign(
      mockQueryError(MOCK_SIGN_IN_EMAIL, MOCK_BLOCKED_ADDRESS_HASH),
      MOCK_CHECK_FAILURE,
    );

    logMagicLinkRefusal(refusal);

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      SIGN_IN_LOG.LINK_REFUSED,
      MOCK_CHECK_FAILURE,
    );
  });
});
