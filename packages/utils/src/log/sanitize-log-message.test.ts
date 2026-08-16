import { sanitizeLogMessage } from './sanitize-log-message';

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
});
