import { clientLogSchema, sanitizeClientLogPayload } from './client-log-schema';

const validPayload = {
  event: 'copy_to_clipboard.write_failed',
  message: 'clipboard write denied',
  stack: 'Error: denied\n  at copy (/blog/hello:1:1)',
  url: '/blog/hello',
  digest: 'abc123',
  userAgent: 'Mozilla/5.0',
};

describe('clientLogSchema', () => {
  it('accepts a payload with exactly the fixed field set', () => {
    const result = clientLogSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  it('accepts a payload with only the required fields', () => {
    const result = clientLogSchema.safeParse({
      event: 'error_boundary.render_failed',
      message: 'boom',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown key outright', () => {
    const result = clientLogSchema.safeParse({
      ...validPayload,
      extra: 'attacker-controlled',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an event name that is not lowercase dot-namespaced', () => {
    const result = clientLogSchema.safeParse({
      ...validPayload,
      event: 'Client-Log; DROP TABLE users;',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an event name with no namespace dot', () => {
    const result = clientLogSchema.safeParse({
      ...validPayload,
      event: 'boom',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a message over the max length', () => {
    const result = clientLogSchema.safeParse({
      ...validPayload,
      message: 'a'.repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty message', () => {
    const result = clientLogSchema.safeParse({ ...validPayload, message: '' });

    expect(result.success).toBe(false);
  });

  it('rejects a stack over the max length', () => {
    const result = clientLogSchema.safeParse({
      ...validPayload,
      stack: 'a'.repeat(1001),
    });

    expect(result.success).toBe(false);
  });
});

describe('sanitizeClientLogPayload', () => {
  it('strips control characters from message and stack', () => {
    const parsed = clientLogSchema.parse({
      event: 'copy_to_clipboard.write_failed',
      message: 'line one\r\nline two',
      stack: 'Error: boom\r\n  at x (/a:1:1)',
    });

    const sanitized = sanitizeClientLogPayload(parsed);

    expect(sanitized.message).not.toMatch(/[\r\n]/);
    expect(sanitized.stack).not.toMatch(/[\r\n]/);
  });

  it('cannot be used to forge a second fake log line via embedded newlines + JSON', () => {
    const forged = JSON.stringify({
      level: 'error',
      event: 'fake.forged_entry',
      message: 'forged',
    });
    const parsed = clientLogSchema.parse({
      event: 'copy_to_clipboard.write_failed',
      message: `real error\n${forged}`,
    });

    const sanitized = sanitizeClientLogPayload(parsed);

    // eslint-disable-next-line no-control-regex -- intentional: asserting the sanitized output contains none of these characters, same range `sanitizeLogMessage` itself strips
    expect(sanitized.message).not.toMatch(/[\x00-\x1f\x7f]/);
    expect(sanitized.message).not.toContain('\n');
  });

  it('strips the query string and fragment from url', () => {
    const parsed = clientLogSchema.parse({
      event: 'copy_to_clipboard.write_failed',
      message: 'x',
      url: '/blog/hello?token=secret&utm_source=x#section',
    });

    const sanitized = sanitizeClientLogPayload(parsed);

    expect(sanitized.url).toBe('/blog/hello');
  });

  it('leaves a url with no query string untouched', () => {
    const parsed = clientLogSchema.parse({
      event: 'copy_to_clipboard.write_failed',
      message: 'x',
      url: '/blog/hello',
    });

    const sanitized = sanitizeClientLogPayload(parsed);

    expect(sanitized.url).toBe('/blog/hello');
  });

  it('leaves optional fields absent when not provided', () => {
    const parsed = clientLogSchema.parse({
      event: 'copy_to_clipboard.write_failed',
      message: 'x',
    });

    const sanitized = sanitizeClientLogPayload(parsed);

    expect(sanitized.stack).toBeUndefined();
    expect(sanitized.url).toBeUndefined();
    expect(sanitized.digest).toBeUndefined();
    expect(sanitized.userAgent).toBeUndefined();
  });
});
