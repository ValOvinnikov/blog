import type { TMaybeUndefined } from '@blog/config';
import { KEY_ENCODING } from '@blog/utils/encryption';
import { faker } from '@faker-js/faker';
import { env } from '@web/utils/env/env';

import {
  mintNewsletterUnsubscribeToken,
  readNewsletterUnsubscribeSubscriberId,
} from './newsletter-unsubscribe-token';

vi.mock('@web/utils/env/env');

faker.seed(6010);

const MOCK_SUBSCRIBER_ID = faker.string.uuid();
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

  it('rejects every token without a key', () => {
    setKey(undefined);

    expect(readNewsletterUnsubscribeSubscriberId(token)).toBeNull();
  });
});
