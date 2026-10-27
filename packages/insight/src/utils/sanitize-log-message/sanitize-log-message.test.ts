import {
  MOCK_ERROR_MESSAGE,
  MOCK_LINE_SEPARATOR,
  MOCK_PARAGRAPH_SEPARATOR,
  MOCK_SEPARATORS,
} from '@blog/insight/testing/fixtures';
import { faker } from '@faker-js/faker';

import { sanitizeLogMessage } from './sanitize-log-message';

faker.seed(6030);

const MOCK_PLAIN_MESSAGE = faker.lorem.sentence();

describe(sanitizeLogMessage, () => {
  it('extracts the message from an Error', () => {
    expect(sanitizeLogMessage(new Error(MOCK_ERROR_MESSAGE))).toBe(
      MOCK_ERROR_MESSAGE,
    );
  });

  it.each([
    ['newlines', 'line one\nline two', 'line one line two'],
    ['carriage returns', 'line one\r\nline two', 'line one  line two'],
    ['other control characters', 'a\x00b\x1fc\x7fd', 'a b c d'],
    ...MOCK_SEPARATORS.map(([name, separator]): [string, string, string] => [
      name,
      `first${separator}second`,
      'first second',
    ]),
  ])(
    'replaces %s in an Error message with spaces',
    (_name, message, expected) => {
      expect(sanitizeLogMessage(new Error(message))).toBe(expected);
    },
  );

  it.each([
    ['plain text', MOCK_PLAIN_MESSAGE, MOCK_PLAIN_MESSAGE],
    ['newlines', 'fake\nlog\nentry', 'fake log entry'],
    [
      'line and paragraph separators',
      `a${MOCK_LINE_SEPARATOR}b${MOCK_PARAGRAPH_SEPARATOR}c`,
      'a b c',
    ],
  ])('stringifies a non-Error value with %s', (_name, value, expected) => {
    expect(sanitizeLogMessage(value)).toBe(expected);
  });
});
