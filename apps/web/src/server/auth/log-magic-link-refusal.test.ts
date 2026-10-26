import { MAGIC_LINK_REFUSAL } from '@blog/config/constants';
import { SIGN_IN_LOG } from '@web/constants/sign-in';
import { logger } from '@web/utils/logger/logger';

import { logMagicLinkRefusal } from './log-magic-link-refusal';

vi.mock('@web/utils/logger/logger');

const CHECK_ERROR = new Error('connection lost');

describe(logMagicLinkRefusal, () => {
  beforeEach(() => {
    vi.mocked(logger.warn).mockReset();
  });

  it.each(Object.values(MAGIC_LINK_REFUSAL))(
    'logs one warn line naming a %s refusal',
    (reason) => {
      logMagicLinkRefusal({ reason });

      expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
        SIGN_IN_LOG.LINK_REFUSED,
        { reason, error: undefined },
      );
    },
  );

  it('carries the error of a failed check', () => {
    logMagicLinkRefusal({
      reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
      error: CHECK_ERROR,
    });

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      SIGN_IN_LOG.LINK_REFUSED,
      { reason: MAGIC_LINK_REFUSAL.CHECK_FAILED, error: CHECK_ERROR },
    );
  });
});
