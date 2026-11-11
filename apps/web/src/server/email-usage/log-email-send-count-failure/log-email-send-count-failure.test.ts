import { EMAIL_TYPE } from '@blog/config/constants';
import { EMAIL_USAGE_LOG } from '@web/constants/email-usage';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { logEmailSendCountFailure } from './log-email-send-count-failure';

describe(logEmailSendCountFailure, () => {
  it('logs one warn line naming the site, the email type and the error', () => {
    const failure = {
      siteId: MOCK_TENANT_ID,
      emailType: EMAIL_TYPE.SIGN_IN,
      error: MOCK_ERROR,
    };

    logEmailSendCountFailure(failure);

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      EMAIL_USAGE_LOG.SEND_COUNT_FAILED,
      failure,
    );
  });
});
