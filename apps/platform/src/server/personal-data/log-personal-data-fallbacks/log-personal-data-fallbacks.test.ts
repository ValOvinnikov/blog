import { PERSONAL_DATA_LOG } from '@blog/config/constants';
import {
  onPersonalDataFallback,
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
  type TPersonalDataFallback,
} from '@blog/db';
import { logger } from '@platform/utils/logger/logger';

import { logPersonalDataFallbacks } from './log-personal-data-fallbacks';

vi.mock('@blog/db', async () => ({
  ...(await vi.importActual('@blog/db/constants')),
  onPersonalDataFallback: vi.fn(),
}));

const MOCK_FALLBACK: TPersonalDataFallback = {
  owner: PERSONAL_DATA_OWNER.SUBSCRIBER,
  reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
};

describe(logPersonalDataFallbacks, () => {
  it('logs each fallback once, without the address', () => {
    logPersonalDataFallbacks();
    const [listener] = vi.mocked(onPersonalDataFallback).mock.calls[0] ?? [];

    listener?.(MOCK_FALLBACK);

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      PERSONAL_DATA_LOG.PLAIN_FALLBACK,
      MOCK_FALLBACK,
    );
  });
});
