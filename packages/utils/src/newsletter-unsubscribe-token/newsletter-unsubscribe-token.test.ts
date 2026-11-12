import { faker } from '@faker-js/faker';

import { KEY_ENCODING } from '@blog/utils/encryption';

import {
  signNewsletterUnsubscribeToken,
  verifyNewsletterUnsubscribeToken,
} from './newsletter-unsubscribe-token';

faker.seed(6010);

const mockKey = (): string =>
  Buffer.from(faker.string.alphanumeric(32)).toString(KEY_ENCODING);

const MOCK_SUBSCRIBER_ID = faker.string.uuid();
const MOCK_KEY = mockKey();

const MOCK_FORMAT_VECTOR_KEY =
  'dW5zdWJzY3JpYmUtdG9rZW4tZm9ybWF0LXZlY3Rvci1rZXk=';
const MOCK_FORMAT_VECTOR_SUBSCRIBER_ID = '3f1c2a9e-7b4d-4e8a-9c21-5d6f0a1b2c3d';
const MOCK_FORMAT_VECTOR_TOKEN = `${MOCK_FORMAT_VECTOR_SUBSCRIBER_ID}~zr61R2cUuQFhnx3qmwN98v7QKRHcnAJKgRzBX4npiqY`;

describe(signNewsletterUnsubscribeToken, () => {
  let token: string;

  beforeEach(() => {
    token = signNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID, MOCK_KEY);
  });

  it('signs the same token for a subscriber on every call', () => {
    expect(signNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID, MOCK_KEY)).toBe(
      token,
    );
  });

  it('signs a different token for another subscriber', () => {
    expect(
      signNewsletterUnsubscribeToken(faker.string.uuid(), MOCK_KEY),
    ).not.toBe(token);
  });

  it('signs a token in the format links already sent carry', () => {
    expect(
      signNewsletterUnsubscribeToken(
        MOCK_FORMAT_VECTOR_SUBSCRIBER_ID,
        MOCK_FORMAT_VECTOR_KEY,
      ),
    ).toBe(MOCK_FORMAT_VECTOR_TOKEN);
  });
});

describe(verifyNewsletterUnsubscribeToken, () => {
  let token: string;

  beforeEach(() => {
    token = signNewsletterUnsubscribeToken(MOCK_SUBSCRIBER_ID, MOCK_KEY);
  });

  it('reads back the subscriber a signed token names', () => {
    expect(verifyNewsletterUnsubscribeToken(token, MOCK_KEY)).toBe(
      MOCK_SUBSCRIBER_ID,
    );
  });

  it('accepts a token from a link already sent', () => {
    expect(
      verifyNewsletterUnsubscribeToken(
        MOCK_FORMAT_VECTOR_TOKEN,
        MOCK_FORMAT_VECTOR_KEY,
      ),
    ).toBe(MOCK_FORMAT_VECTOR_SUBSCRIBER_ID);
  });

  it('rejects a token whose signature was made for another subscriber', () => {
    const signedTail = token.slice(MOCK_SUBSCRIBER_ID.length);

    expect(
      verifyNewsletterUnsubscribeToken(
        `${faker.string.uuid()}${signedTail}`,
        MOCK_KEY,
      ),
    ).toBeNull();
  });

  it('rejects a token signed with another key', () => {
    expect(verifyNewsletterUnsubscribeToken(token, mockKey())).toBeNull();
  });

  it('rejects an unsigned token', () => {
    expect(
      verifyNewsletterUnsubscribeToken(faker.string.uuid(), MOCK_KEY),
    ).toBeNull();
  });

  it('rejects a token with an empty subscriber id', () => {
    expect(
      verifyNewsletterUnsubscribeToken(
        signNewsletterUnsubscribeToken('', MOCK_KEY),
        MOCK_KEY,
      ),
    ).toBeNull();
  });
});
