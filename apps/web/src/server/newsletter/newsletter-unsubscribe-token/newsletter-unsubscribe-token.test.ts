import { faker } from '@faker-js/faker';
import type { TMaybeUndefined } from '@shinefold/config';
import { KEY_ENCODING } from '@shinefold/utils/encryption';
import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { MOCK_SUBSCRIBER_ID } from '@web/testing/server/newsletter/fixtures';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';

import {
  mintNewsletterUnsubscribeToken,
  readNewsletterUnsubscribeSubscriberId,
} from './newsletter-unsubscribe-token';

vi.mock('@web/utils/env/env');

faker.seed(6010);

const MOCK_KEY = Buffer.from(faker.string.alphanumeric(32)).toString(
  KEY_ENCODING,
);

const setKey = (key: TMaybeUndefined<string>): void => {
  Object.assign(env, { NEWSLETTER_UNSUBSCRIBE_KEY: key });
};

beforeEach(() => {
  setKey(MOCK_KEY);
});

describe(mintNewsletterUnsubscribeToken, () => {
  it('throws without a key', () => {
    setKey(undefined);

    expect(() => mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID)).toThrow();
  });
});

describe(readNewsletterUnsubscribeSubscriberId, () => {
  let token: string;

  beforeEach(() => {
    token = mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID);
  });

  it('reads back the subscriber a minted token names', () => {
    expect(readNewsletterUnsubscribeSubscriberId(token)).toBe(
      MOCK_SUBSCRIBER_ID,
    );
  });

  describe('without a key', () => {
    beforeEach(() => {
      setKey(undefined);
    });

    it('rejects every token', () => {
      expect(readNewsletterUnsubscribeSubscriberId(token)).toBeNull();
    });

    it('logs the missing key once per read', () => {
      readNewsletterUnsubscribeSubscriberId(token);

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        NEWSLETTER_LOG.UNSUBSCRIBE_KEY_MISSING,
      );
    });
  });

  it('logs nothing while the key is set', () => {
    readNewsletterUnsubscribeSubscriberId(token);

    expect(logger.error).not.toHaveBeenCalled();
  });
});
