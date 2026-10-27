import { faker } from '@faker-js/faker';

import { clientLogSchema, sanitizeClientLogPayload } from './client-log-schema';

faker.seed(6010);

const MESSAGE_MAX_LENGTH = 500;
const STACK_MAX_LENGTH = 1000;

const MOCK_EVENT = `${faker.lorem.word()}.${faker.lorem.word()}`;
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_URL_PATH = `/${faker.lorem.word()}/${faker.lorem.word()}`;
const MOCK_QUERY_AND_FRAGMENT = `?token=${faker.string.alphanumeric(8)}&utm_source=${faker.lorem.word()}#${faker.lorem.word()}`;

const MOCK_VALID_PAYLOAD = {
  event: MOCK_EVENT,
  message: MOCK_MESSAGE,
  stack: faker.lorem.lines(2),
  url: MOCK_URL_PATH,
  digest: faker.string.alphanumeric(8),
  userAgent: faker.internet.userAgent(),
};

describe('clientLogSchema', () => {
  it.each([
    ['the fixed field set', MOCK_VALID_PAYLOAD],
    ['only the required fields', { event: MOCK_EVENT, message: MOCK_MESSAGE }],
  ])('accepts a payload with %s', (_label, payload) => {
    const result = clientLogSchema.safeParse(payload);

    expect(result.success).toBe(true);
  });

  it.each([
    ['an unknown key', { extra: faker.lorem.word() }],
    [
      'an event name that is not lowercase dot-namespaced',
      { event: `${faker.lorem.word().toUpperCase()}; DROP TABLE users;` },
    ],
    ['an event name with no namespace dot', { event: faker.lorem.word() }],
    [
      'a message over the max length',
      { message: faker.string.alpha(MESSAGE_MAX_LENGTH + 1) },
    ],
    ['an empty message', { message: '' }],
    [
      'a stack over the max length',
      { stack: faker.string.alpha(STACK_MAX_LENGTH + 1) },
    ],
  ])('rejects %s', (_label, override) => {
    const result = clientLogSchema.safeParse({
      ...MOCK_VALID_PAYLOAD,
      ...override,
    });

    expect(result.success).toBe(false);
  });
});

describe(sanitizeClientLogPayload, () => {
  it('strips control characters from message and stack', () => {
    const parsed = clientLogSchema.parse({
      event: MOCK_EVENT,
      message: `${faker.lorem.word()}\r\n${faker.lorem.word()}`,
      stack: `${faker.lorem.word()}\r\n${faker.lorem.word()}`,
    });

    const sanitized = sanitizeClientLogPayload(parsed);

    expect(sanitized.message).not.toMatch(/[\r\n]/);
    expect(sanitized.stack).not.toMatch(/[\r\n]/);
  });

  it.each([
    ['strips the query string and fragment from', MOCK_QUERY_AND_FRAGMENT],
    ['leaves a url with no query string untouched in', ''],
  ])('%s the url', (_label, suffix) => {
    const parsed = clientLogSchema.parse({
      event: MOCK_EVENT,
      message: MOCK_MESSAGE,
      url: `${MOCK_URL_PATH}${suffix}`,
    });

    const sanitized = sanitizeClientLogPayload(parsed);

    expect(sanitized.url).toBe(MOCK_URL_PATH);
  });

  it('leaves optional fields absent when not provided', () => {
    const parsed = clientLogSchema.parse({
      event: MOCK_EVENT,
      message: MOCK_MESSAGE,
    });

    const sanitized = sanitizeClientLogPayload(parsed);

    expect(sanitized).toEqual({ event: MOCK_EVENT, message: MOCK_MESSAGE });
  });
});
