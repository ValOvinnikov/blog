import { sanitizeLogMessage } from './sanitize-log-message';

describe(sanitizeLogMessage, () => {
  it('extracts the message from an Error', () => {
    expect(sanitizeLogMessage(new Error('boom'))).toBe('boom');
  });

  it('stringifies a non-Error value', () => {
    expect(sanitizeLogMessage('plain string')).toBe('plain string');
  });

  it('replaces control characters (including newlines) with spaces', () => {
    expect(
      sanitizeLogMessage(new Error('line one\nline two\r\ntab\there')),
    ).toBe('line one line two  tab here');
  });

  it('strips DEL (0x7f)', () => {
    expect(sanitizeLogMessage(`bad\x7fvalue`)).toBe('bad value');
  });
});
