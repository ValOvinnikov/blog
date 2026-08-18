import { createLogger, LOG_LEVEL } from './logger';

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

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

  it('does not let a spoofed reserved field in context override level/event/ts', () => {
    const logger = createLogger();
    logger.error('real.event', {
      level: 'not-a-real-level',
      event: 'spoofed',
      ts: 'fake',
    });

    const parsed = JSON.parse(captureCall(errorSpy)) as Record<string, unknown>;
    expect(parsed.level).toBe(LOG_LEVEL.ERROR);
    expect(parsed.event).toBe('real.event');
    expect(typeof parsed.ts).toBe('string');
    expect(parsed.ts).not.toBe('fake');
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

  it('unwraps an Error nested one level deep inside a plain object', () => {
    const logger = createLogger();
    const cause = new Error('nested boom');
    cause.stack = 'Error: nested boom\n  at somewhere ()';

    logger.error('request.failed', { details: { cause } });

    const parsed = JSON.parse(captureCall(errorSpy)) as {
      details: { cause: { message: string; stack: string } };
    };
    expect(parsed.details.cause.message).toBe('nested boom');
    expect(parsed.details.cause.stack).toBe(cause.stack);
  });

  it('unwraps Errors nested inside an array', () => {
    const logger = createLogger();
    const first = new Error('first failure');
    const second = new Error('second failure');

    logger.error('batch.failed', {
      errors: [first, second, 'not an error'],
    });

    const parsed = JSON.parse(captureCall(errorSpy)) as {
      errors: [{ message: string }, { message: string }, string];
    };
    expect(parsed.errors[0].message).toBe('first failure');
    expect(parsed.errors[1].message).toBe('second failure');
    expect(parsed.errors[2]).toBe('not an error');
  });

  it('terminates without hanging or throwing on a cyclic context object', () => {
    const logger = createLogger();
    const cyclic: Record<string, unknown> = { name: 'cycle' };
    cyclic.self = cyclic;

    expect(() =>
      logger.error('cyclic.context', { data: cyclic }),
    ).not.toThrow();

    const parsed = JSON.parse(captureCall(errorSpy)) as {
      data: { name: string; self: string };
    };
    expect(parsed.data.name).toBe('cycle');
    expect(parsed.data.self).toBe('[Circular]');
  });

  it('still unwraps an Error nested just within the depth limit', () => {
    const logger = createLogger();
    const error = new Error('within limit');

    // 4 wrapper levels puts the object holding `error` one level short of
    // the recursion bound, so it should still be reached and unwrapped.
    let value: unknown = { error };
    for (let i = 0; i < 4; i++) {
      value = { nested: value };
    }

    logger.error('deep.context', { deep: value });

    const parsed = JSON.parse(captureCall(errorSpy)) as Record<string, unknown>;
    let cursor = parsed.deep as Record<string, unknown>;
    for (let i = 0; i < 4; i++) {
      cursor = cursor.nested as Record<string, unknown>;
    }
    expect((cursor.error as { message: string }).message).toBe('within limit');
  });

  it('does not unwrap an Error nested past the depth limit, and does not throw', () => {
    const logger = createLogger();
    const error = new Error('too deep');

    // 5 wrapper levels puts the object holding `error` exactly at the
    // recursion bound, so it should be replaced by the depth marker instead
    // of being recursed into.
    let value: unknown = { error };
    for (let i = 0; i < 5; i++) {
      value = { nested: value };
    }

    expect(() => logger.error('deep.context', { deep: value })).not.toThrow();

    const parsed = JSON.parse(captureCall(errorSpy)) as Record<string, unknown>;
    let cursor = parsed.deep as Record<string, unknown>;
    for (let i = 0; i < 4; i++) {
      cursor = cursor.nested as Record<string, unknown>;
    }
    expect(cursor.nested).toBe('[MaxDepthExceeded]');
    expect(JSON.stringify(parsed)).not.toContain('too deep');
  });

  it('does not run a plain string context value through sanitizeLogMessage (only Error.message is)', () => {
    const logger = createLogger();
    const multiline = 'first line\nsecond line';
    logger.info('note', { text: multiline });

    const parsed = JSON.parse(captureCall(infoSpy)) as Record<string, unknown>;
    expect(parsed.text).toBe(multiline);
  });

  it('neutralizes a raw U+2028 in a plain string context value', () => {
    const logger = createLogger();
    const withSeparator = `first line${LINE_SEPARATOR}second line`;
    logger.error('note', { text: withSeparator });

    const line = captureCall(errorSpy);
    expect(line.includes(LINE_SEPARATOR)).toBe(false);

    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.text).toBe('first line second line');
  });

  it('neutralizes a raw U+2029 in a plain string context value', () => {
    const logger = createLogger();
    const withSeparator = `first para${PARAGRAPH_SEPARATOR}second para`;
    logger.error('note', { text: withSeparator });

    const line = captureCall(errorSpy);
    expect(line.includes(PARAGRAPH_SEPARATOR)).toBe(false);

    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.text).toBe('first para second para');
  });

  it('neutralizes U+2028/U+2029 in a string nested inside a plain object and an array', () => {
    const logger = createLogger();
    logger.error('note', {
      details: { message: `nested${LINE_SEPARATOR}message` },
      items: [`array${PARAGRAPH_SEPARATOR}item`],
    });

    const line = captureCall(errorSpy);
    expect(line.includes(LINE_SEPARATOR)).toBe(false);
    expect(line.includes(PARAGRAPH_SEPARATOR)).toBe(false);

    const parsed = JSON.parse(line) as {
      details: { message: string };
      items: string[];
    };
    expect(parsed.details.message).toBe('nested message');
    expect(parsed.items[0]).toBe('array item');
  });

  it('does not mark a shared (non-cyclic) reference as circular', () => {
    const logger = createLogger();
    const shared = { id: 1 };

    logger.error('shared.ref', { a: shared, b: shared });

    const parsed = JSON.parse(captureCall(errorSpy)) as {
      a: { id: number };
      b: { id: number };
    };
    expect(parsed.a).toEqual({ id: 1 });
    expect(parsed.b).toEqual({ id: 1 });
  });

  it('passes a Date nested in context through untouched instead of recursing into it', () => {
    const logger = createLogger();
    const date = new Date('2024-01-01T00:00:00.000Z');

    logger.error('mixed.types', { date });

    const parsed = JSON.parse(captureCall(errorSpy)) as { date: string };
    expect(parsed.date).toBe(date.toISOString());
  });

  it('passes a class instance nested in context through untouched instead of recursing into it', () => {
    class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
    }
    const logger = createLogger();

    logger.error('mixed.types', { point: new Point(1, 2) });

    const parsed = JSON.parse(captureCall(errorSpy)) as {
      point: { x: number; y: number };
    };
    expect(parsed.point).toEqual({ x: 1, y: 2 });
  });

  it('treats an Object.create(null) value as a plain object and recurses into it', () => {
    const logger = createLogger();
    const cause = new Error('null-proto boom');
    const nullProtoObj: Record<string, unknown> = Object.create(null) as Record<
      string,
      unknown
    >;
    nullProtoObj.cause = cause;

    logger.error('request.failed', { details: nullProtoObj });

    const parsed = JSON.parse(captureCall(errorSpy)) as {
      details: { cause: { message: string } };
    };
    expect(parsed.details.cause.message).toBe('null-proto boom');
  });
});
