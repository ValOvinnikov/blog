import { createLogger, LOG_LEVEL } from './logger';

function captureCall(spy: ReturnType<typeof vi.spyOn>): string {
  const call = spy.mock.calls.at(-1);
  if (!call) {
    throw new Error('console spy was not called');
  }

  return call[0] as string;
}

describe(createLogger, () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('emits a single-line JSON object via the matching console method', () => {
    const logger = createLogger({ service: 'web' });
    logger.info('user.signed_in', { userId: 'u_1' });

    const line = captureCall(infoSpy);
    expect(line.includes('\n')).toBe(false);

    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.level).toBe(LOG_LEVEL.INFO);
    expect(parsed.event).toBe('user.signed_in');
    expect(parsed.service).toBe('web');
    expect(parsed.userId).toBe('u_1');
    expect(typeof parsed.ts).toBe('string');
  });

  it('routes error/warn/info to their matching console method', () => {
    const logger = createLogger();
    logger.error('a', {});
    logger.warn('b', {});

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('cannot let a control character in context terminate the log line or forge a second entry', () => {
    const logger = createLogger();
    const forgedEntry = '"}\n{"level":"error","event":"forged"';
    logger.error('caught.value', {
      text: `first line\r\nsecond line\x00${forgedEntry}`,
    });

    const line = captureCall(errorSpy);
    expect(line.split('\n')).toHaveLength(1);

    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.text).toBe(`first line\r\nsecond line\x00${forgedEntry}`);
  });

  it('sanitizes an Error passed in context and truncates a long stack', () => {
    const logger = createLogger();
    const error = new Error('boom\nwith a newline');
    error.stack = `Error: boom\n${'  at fakeFrame ()\n'.repeat(500)}`;

    logger.error('request.failed', { error });

    const line = captureCall(errorSpy);
    const parsed = JSON.parse(line) as {
      error: { message: string; stack: string };
    };

    expect(parsed.error.message).toBe('boom with a newline');
    expect(parsed.error.stack.endsWith('...[truncated]')).toBe(true);
    expect(parsed.error.stack.length).toBeLessThan(error.stack.length);
  });

  it('leaves a short stack untouched', () => {
    const logger = createLogger();
    const error = new Error('boom');
    error.stack = 'Error: boom\n  at short ()';

    logger.error('request.failed', { error });

    const parsed = JSON.parse(captureCall(errorSpy)) as {
      error: { stack: string };
    };
    expect(parsed.error.stack).toBe(error.stack);
  });

  it('omits undefined context fields instead of emitting null', () => {
    const logger = createLogger();
    logger.warn('event.name', { present: 'value', missing: undefined });

    const parsed = JSON.parse(captureCall(warnSpy)) as Record<string, unknown>;
    expect(parsed.present).toBe('value');
    expect('missing' in parsed).toBe(false);
  });

  it('does not throw when called with no context and no base context', () => {
    const logger = createLogger();
    expect(() => logger.error('bare.event')).not.toThrow();
    expect(() => logger.warn('bare.event')).not.toThrow();
    expect(() => logger.info('bare.event')).not.toThrow();
    expect(() => logger.debug('bare.event')).not.toThrow();
  });

  it('is a no-op for debug in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const logger = createLogger();
    logger.debug('should.not.emit', { any: 'thing' });

    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('emits debug outside production', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const logger = createLogger();
    logger.debug('should.emit');

    expect(debugSpy).toHaveBeenCalledTimes(1);
  });
});
