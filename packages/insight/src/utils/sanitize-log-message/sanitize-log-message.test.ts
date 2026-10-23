import {
  MOCK_ERROR_MESSAGE,
  MOCK_LINE_SEPARATOR,
  MOCK_PARAGRAPH_SEPARATOR,
  MOCK_SEPARATORS,
} from '@blog/insight/testing/fixtures';

import { sanitizeLogMessage } from './sanitize-log-message';

const SANITIZED_LINES = 'line one line two';
const PLAIN_STRING_ERROR = 'plain string error';
const PLAIN_MESSAGE = 'a plain message';

describe(sanitizeLogMessage, () => {
  it('extracts the message from an Error', () => {
    expect(sanitizeLogMessage(new Error(MOCK_ERROR_MESSAGE))).toBe(
      MOCK_ERROR_MESSAGE,
    );
  });

  it.each([
    ['newlines', 'line one\nline two', SANITIZED_LINES],
    ['carriage returns', 'line one\r\nline two', 'line one  line two'],
    ['other control characters', 'a\x00b\x1fc\x7fd', 'a b c d'],
  ])('replaces %s with spaces', (_name, message, expected) => {
    expect(sanitizeLogMessage(new Error(message))).toBe(expected);
  });

  it('stringifies a non-Error thrown value', () => {
    expect(sanitizeLogMessage(PLAIN_STRING_ERROR)).toBe(PLAIN_STRING_ERROR);
  });

  it('stringifies a non-Error value containing newlines', () => {
    expect(sanitizeLogMessage('fake\nlog\nentry')).toBe('fake log entry');
  });

  it('leaves plain text untouched', () => {
    expect(sanitizeLogMessage(new Error(PLAIN_MESSAGE))).toBe(PLAIN_MESSAGE);
  });

  it.each(MOCK_SEPARATORS)('replaces %s with a space', (_name, separator) => {
    expect(sanitizeLogMessage(new Error(`first${separator}second`))).toBe(
      'first second',
    );
  });

  it('replaces U+2028/U+2029 in a non-Error value', () => {
    const message = `a${MOCK_LINE_SEPARATOR}b${MOCK_PARAGRAPH_SEPARATOR}c`;
    expect(sanitizeLogMessage(message)).toBe('a b c');
  });
});
