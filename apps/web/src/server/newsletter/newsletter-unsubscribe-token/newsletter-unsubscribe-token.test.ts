import { faker } from '@faker-js/faker';
import { env } from '@web/utils/env/env';

import {
  mintNewsletterUnsubscribeToken,
  readNewsletterUnsubscribeSubscriberId,
} from './newsletter-unsubscribe-token';

vi.mock('@web/utils/env/env', () => ({ env: {} }));

const SUBSCRIBER_ID = faker.string.uuid();
const KEY = Buffer.from(faker.string.alphanumeric(32)).toString('base64');

const setKey = (key: string | undefined): void => {
  Object.assign(env, { NEWSLETTER_UNSUBSCRIBE_KEY: key });
};

describe(mintNewsletterUnsubscribeToken, () => {
  beforeEach(() => setKey(KEY));

  it('mints the same token for a subscriber on every call', () => {
    expect(mintNewsletterUnsubscribeToken(SUBSCRIBER_ID)).toBe(
      mintNewsletterUnsubscribeToken(SUBSCRIBER_ID),
    );
  });

  it('mints a different token for another subscriber', () => {
    expect(mintNewsletterUnsubscribeToken(faker.string.uuid())).not.toBe(
      mintNewsletterUnsubscribeToken(SUBSCRIBER_ID),
    );
  });

  it('throws without a key', () => {
    setKey(undefined);

    expect(() => mintNewsletterUnsubscribeToken(SUBSCRIBER_ID)).toThrow();
  });
});

describe(readNewsletterUnsubscribeSubscriberId, () => {
  beforeEach(() => setKey(KEY));

  it('reads back the subscriber a minted token names', () => {
    const token = mintNewsletterUnsubscribeToken(SUBSCRIBER_ID);

    expect(readNewsletterUnsubscribeSubscriberId(token)).toBe(SUBSCRIBER_ID);
  });

  it('rejects a token whose signature was made for another subscriber', () => {
    const [, signature] =
      mintNewsletterUnsubscribeToken(SUBSCRIBER_ID).split('.');

    expect(
      readNewsletterUnsubscribeSubscriberId(
        `${faker.string.uuid()}.${signature}`,
      ),
    ).toBeNull();
  });

  it('rejects a token signed with another key', () => {
    const token = mintNewsletterUnsubscribeToken(SUBSCRIBER_ID);
    setKey(Buffer.from(faker.string.alphanumeric(32)).toString('base64'));

    expect(readNewsletterUnsubscribeSubscriberId(token)).toBeNull();
  });

  it('rejects a random token from an email sent before tokens were signed', () => {
    expect(
      readNewsletterUnsubscribeSubscriberId(faker.string.uuid()),
    ).toBeNull();
  });

  it('rejects a token with an empty subscriber id', () => {
    const [, signature] = mintNewsletterUnsubscribeToken('').split('.');

    expect(readNewsletterUnsubscribeSubscriberId(`.${signature}`)).toBeNull();
  });

  it('rejects every token without a key', () => {
    const token = mintNewsletterUnsubscribeToken(SUBSCRIBER_ID);
    setKey(undefined);

    expect(readNewsletterUnsubscribeSubscriberId(token)).toBeNull();
  });
});
