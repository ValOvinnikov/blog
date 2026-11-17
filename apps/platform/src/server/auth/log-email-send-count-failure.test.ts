import { EMAIL_USAGE_LOG } from '@platform/constants/email-usage';
import { mockQueryError } from '@platform/testing/loggable-error/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { EMAIL_TYPE } from '@shinefold/config/constants';

import { logEmailSendCountFailure } from './log-email-send-count-failure';

describe(logEmailSendCountFailure, () => {
  it('logs one warn line naming the email type and the error', () => {
    const error = mockQueryError();

    logEmailSendCountFailure({ emailType: EMAIL_TYPE.INVITE, error });

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      EMAIL_USAGE_LOG.SEND_COUNT_FAILED,
      { emailType: EMAIL_TYPE.INVITE, error },
    );
  });
});
