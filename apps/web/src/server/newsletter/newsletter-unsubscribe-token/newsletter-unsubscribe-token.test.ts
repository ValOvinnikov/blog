import { KEY_ENCODING } from '@blog/utils/encryption';
import { faker } from '@faker-js/faker';
import { env } from '@web/utils/env/env';

import {
  mintNewsletterUnsubscribeToken,
  readNewsletterUnsubscribeSubscriberId,
} from './newsletter-unsubscribe-token';

vi.mock('@web/utils/env/env');

faker.seed(6010);

const mockKey = (): string =>
  Buffer.from(faker.string.alphanumeric(32)).toString(KEY_ENCODING);

const MOCK_SUBSCRIBER_ID = faker.string.uuid();
const MOCK_KEY = mockKey();

const setKey = (key: string | undefined): void => {
  Object.assign(env, { NEWSLETTER_UNSUBSCRIBE_KEY: key });
};

beforeEach(() => {
  setKey(MOCK_KEY);
});

describe(mintNewsletterUnsubscribeToken, () => {
  it('mints the same token for a subscriber on every call', () => {
    const first = mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID);
    const second = mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID);

    expect(first).toBe(second);
  });

  it('mints a different token for another subscriber', () => {
    const own = mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID);
    const other = mintNewsletterUnsubscribeToken(faker.string.uuid());

    expect(other).not.toBe(own);
  });

  it('throws without a key', () => {
    setKey(undefined);

    expect(() => mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID)).toThrow();
  });
});

describe(readNewsletterUnsubscribeSubscriberId, () => {
  it('reads back the subscriber a minted token names', () => {
    const token = mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID);

    const subscriberId = readNewsletterUnsubscribeSubscriberId(token);

    expect(subscriberId).toBe(MOCK_SUBSCRIBER_ID);
  });

  it('rejects a token whose signature was made for another subscriber', () => {
    const signedTail = mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID).slice(
      MOCK_SUBSCRIBER_ID.length,
    );

    const subscriberId = readNewsletterUnsubscribeSubscriberId(
      `${faker.string.uuid()}${signedTail}`,
    );

    expect(subscriberId).toBeNull();
  });

  it('rejects a token signed with another key', () => {
    const token = mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID);
    setKey(mockKey());

    const subscriberId = readNewsletterUnsubscribeSubscriberId(token);

    expect(subscriberId).toBeNull();
  });

  it('rejects a random token from an email sent before tokens were signed', () => {
    const subscriberId = readNewsletterUnsubscribeSubscriberId(
      faker.string.uuid(),
    );

    expect(subscriberId).toBeNull();
  });

  it('rejects a token with an empty subscriber id', () => {
    const token = mintNewsletterUnsubscribeToken('');

    const subscriberId = readNewsletterUnsubscribeSubscriberId(token);

    expect(subscriberId).toBeNull();
  });

  it('rejects every token without a key', () => {
    const token = mintNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID);
    setKey(undefined);

    const subscriberId = readNewsletterUnsubscribeSubscriberId(token);

    expect(subscriberId).toBeNull();
  });
});
