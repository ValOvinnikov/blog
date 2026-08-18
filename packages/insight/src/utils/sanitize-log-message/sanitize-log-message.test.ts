import { sanitizeLogMessage } from './sanitize-log-message';

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

describe(sanitizeLogMessage, () => {
  it('extracts the message from an Error', () => {
    expect(sanitizeLogMessage(new Error('boom'))).toBe('boom');
  });

  it('replaces newlines with spaces', () => {
    expect(sanitizeLogMessage(new Error('line one\nline two'))).toBe(
      'line one line two',
    );
  });

  it('replaces carriage returns with spaces', () => {
    expect(sanitizeLogMessage(new Error('line one\r\nline two'))).toBe(
      'line one  line two',
    );
  });

  it('replaces other control characters with spaces', () => {
    expect(sanitizeLogMessage(new Error('a\x00b\x1fc\x7fd'))).toBe('a b c d');
  });

  it('stringifies a non-Error thrown value', () => {
    expect(sanitizeLogMessage('plain string error')).toBe('plain string error');
  });

  it('stringifies a non-Error value containing newlines', () => {
    expect(sanitizeLogMessage('fake\nlog\nentry')).toBe('fake log entry');
  });

  it('leaves plain text untouched', () => {
    expect(sanitizeLogMessage(new Error('a plain message'))).toBe(
      'a plain message',
    );
  });

  it('replaces U+2028 (line separator) with a space', () => {
    const message = `line one${LINE_SEPARATOR}line two`;
    expect(sanitizeLogMessage(new Error(message))).toBe('line one line two');
  });

  it('replaces U+2029 (paragraph separator) with a space', () => {
    const message = `para one${PARAGRAPH_SEPARATOR}para two`;
    expect(sanitizeLogMessage(new Error(message))).toBe('para one para two');
  });

  it('replaces U+2028/U+2029 in a non-Error value', () => {
    const message = `a${LINE_SEPARATOR}b${PARAGRAPH_SEPARATOR}c`;
    expect(sanitizeLogMessage(message)).toBe('a b c');
  });
});
