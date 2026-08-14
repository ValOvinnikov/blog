import { sanitizeLogMessage } from './sanitize-log-message';

describe(sanitizeLogMessage, () => {
  it("reads an Error's message", () => {
    expect(sanitizeLogMessage(new Error('boom'))).toBe('boom');
  });

  it('stringifies a non-Error value', () => {
    expect(sanitizeLogMessage('boom')).toBe('boom');
  });

  it('replaces control characters (e.g. injected newlines) with a space', () => {
    expect(sanitizeLogMessage('line one\nfake log line')).toBe(
      'line one fake log line',
    );
  });
});
