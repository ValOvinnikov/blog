import { registerLogSink, type TLogSink } from '@blog/insight/sink/log-sink';
import {
  MOCK_ERROR_MESSAGE,
  MOCK_EVENT,
  MOCK_LINE_SEPARATOR,
  MOCK_PARAGRAPH_SEPARATOR,
  MOCK_SERVICE,
} from '@blog/insight/testing/fixtures';

import { createLogger, LOG_LEVEL } from './logger';

const SIGNED_IN_EVENT = 'user.signed_in';
const REAL_EVENT = 'real.event';
const BARE_EVENT = 'bare.event';
const NESTED_ERROR_MESSAGE = 'nested boom';
const FIRST_FAILURE_MESSAGE = 'first failure';
const SECOND_FAILURE_MESSAGE = 'second failure';
const NOT_AN_ERROR = 'not an error';
const WITHIN_LIMIT_MESSAGE = 'within limit';
const DEEP_CONTEXT_EVENT = 'deep.context';
const MIXED_TYPES_EVENT = 'mixed.types';
const NULL_PROTO_ERROR_MESSAGE = 'null-proto boom';
const RETRY_EVENT = 'retry.scheduled';

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
    const logger = createLogger({ service: MOCK_SERVICE });
    logger.info(SIGNED_IN_EVENT, { userId: 'u_1' });

    const line = captureCall(infoSpy);
    expect(line.includes('\n')).toBe(false);

    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.level).toBe(LOG_LEVEL.INFO);
    expect(parsed.event).toBe(SIGNED_IN_EVENT);
    expect(parsed.service).toBe(MOCK_SERVICE);
    expect(parsed.userId).toBe('u_1');
    expect(typeof parsed.ts).toBe('string');
  });

  describe('with no base context', () => {
    let logger: ReturnType<typeof createLogger>;

    beforeEach(() => {
      logger = createLogger();
    });

    it('routes error/warn/info to their matching console method', () => {
      logger.error('a', {});
      logger.warn('b', {});

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('cannot let a control character in context terminate the log line or forge a second entry', () => {
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
      logger.error(REAL_EVENT, {
        level: 'not-a-real-level',
        event: 'spoofed',
        ts: 'fake',
      });

      const parsed = JSON.parse(captureCall(errorSpy)) as Record<
        string,
        unknown
      >;
      expect(parsed.level).toBe(LOG_LEVEL.ERROR);
      expect(parsed.event).toBe(REAL_EVENT);
      expect(typeof parsed.ts).toBe('string');
      expect(parsed.ts).not.toBe('fake');
    });

    it('sanitizes an Error passed in context and truncates a long stack', () => {
      const error = new Error('boom\nwith a newline');
      error.stack = `Error: boom\n${'  at fakeFrame ()\n'.repeat(500)}`;

      logger.error(MOCK_EVENT, { error });

      const line = captureCall(errorSpy);
      const parsed = JSON.parse(line) as {
        error: { message: string; stack: string };
      };

      expect(parsed.error.message).toBe('boom with a newline');
      expect(parsed.error.stack.endsWith('...[truncated]')).toBe(true);
      expect(parsed.error.stack.length).toBeLessThan(error.stack.length);
    });

    it('keeps the name of an Error, and its string digest and code', () => {
      const error = Object.assign(new TypeError('render failed'), {
        digest: 'DYNAMIC_SERVER_USAGE',
        code: 'ERR_RENDER',
      });

      logger.error('request.unhandled_error', { error });

      const parsed = JSON.parse(captureCall(errorSpy)) as {
        error: { name: string; digest: string; code: string };
      };
      expect(parsed.error.name).toBe('TypeError');
      expect(parsed.error.digest).toBe('DYNAMIC_SERVER_USAGE');
      expect(parsed.error.code).toBe('ERR_RENDER');
    });

    it('leaves out a digest or code that is not a string', () => {
      const error = Object.assign(new Error(MOCK_ERROR_MESSAGE), {
        digest: 42,
        code: { nested: true },
      });

      logger.error(MOCK_EVENT, { error });

      const parsed = JSON.parse(captureCall(errorSpy)) as {
        error: Record<string, unknown>;
      };
      expect('digest' in parsed.error).toBe(false);
      expect('code' in parsed.error).toBe(false);
    });

    it('logs an Error without a digest or code as its name, message and stack', () => {
      const error = new Error(MOCK_ERROR_MESSAGE);
      error.stack = 'Error: boom\n  at short ()';

      logger.error(MOCK_EVENT, { error });

      const parsed = JSON.parse(captureCall(errorSpy)) as {
        error: Record<string, unknown>;
      };
      expect(parsed.error).toEqual({
        name: 'Error',
        message: MOCK_ERROR_MESSAGE,
        stack: error.stack,
      });
    });

    it('strips control characters from a digest', () => {
      const error = Object.assign(new Error(MOCK_ERROR_MESSAGE), {
        digest: 'abc\ninjected',
      });

      logger.error(MOCK_EVENT, { error });

      const parsed = JSON.parse(captureCall(errorSpy)) as {
        error: { digest: string };
      };
      expect(parsed.error.digest).toBe('abc injected');
    });

    it('omits undefined context fields instead of emitting null', () => {
      logger.warn('event.name', { present: 'value', missing: undefined });

      const parsed = JSON.parse(captureCall(warnSpy)) as Record<
        string,
        unknown
      >;
      expect(parsed.present).toBe('value');
      expect('missing' in parsed).toBe(false);
    });

    it('does not throw when called with no context and no base context', () => {
      expect(() => logger.error(BARE_EVENT)).not.toThrow();
      expect(() => logger.warn(BARE_EVENT)).not.toThrow();
      expect(() => logger.info(BARE_EVENT)).not.toThrow();
      expect(() => logger.debug(BARE_EVENT)).not.toThrow();
    });

    it('is a no-op for debug in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      logger.debug('should.not.emit', { any: 'thing' });

      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('emits debug outside production', () => {
      vi.stubEnv('NODE_ENV', 'test');
      logger.debug('should.emit');

      expect(debugSpy).toHaveBeenCalledTimes(1);
    });

    it('unwraps an Error nested one level deep inside a plain object', () => {
      const cause = new Error(NESTED_ERROR_MESSAGE);
      cause.stack = 'Error: nested boom\n  at somewhere ()';

      logger.error(MOCK_EVENT, { details: { cause } });

      const parsed = JSON.parse(captureCall(errorSpy)) as {
        details: { cause: { message: string; stack: string } };
      };
      expect(parsed.details.cause.message).toBe(NESTED_ERROR_MESSAGE);
      expect(parsed.details.cause.stack).toBe(cause.stack);
    });

    it('unwraps Errors nested inside an array', () => {
      const first = new Error(FIRST_FAILURE_MESSAGE);
      const second = new Error(SECOND_FAILURE_MESSAGE);

      logger.error('batch.failed', {
        errors: [first, second, NOT_AN_ERROR],
      });

      const parsed = JSON.parse(captureCall(errorSpy)) as {
        errors: [{ message: string }, { message: string }, string];
      };
      expect(parsed.errors[0].message).toBe(FIRST_FAILURE_MESSAGE);
      expect(parsed.errors[1].message).toBe(SECOND_FAILURE_MESSAGE);
      expect(parsed.errors[2]).toBe(NOT_AN_ERROR);
    });

    it('terminates without hanging or throwing on a cyclic context object', () => {
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
      const error = new Error(WITHIN_LIMIT_MESSAGE);

      let value: unknown = { error };
      for (let i = 0; i < 4; i++) {
        value = { nested: value };
      }

      logger.error(DEEP_CONTEXT_EVENT, { deep: value });

      const parsed = JSON.parse(captureCall(errorSpy)) as Record<
        string,
        unknown
      >;
      let cursor = parsed.deep as Record<string, unknown>;
      for (let i = 0; i < 4; i++) {
        cursor = cursor.nested as Record<string, unknown>;
      }
      expect((cursor.error as { message: string }).message).toBe(
        WITHIN_LIMIT_MESSAGE,
      );
    });

    it('does not unwrap an Error nested past the depth limit, and does not throw', () => {
      const error = new Error('too deep');

      let value: unknown = { error };
      for (let i = 0; i < 5; i++) {
        value = { nested: value };
      }

      expect(() =>
        logger.error(DEEP_CONTEXT_EVENT, { deep: value }),
      ).not.toThrow();

      const parsed = JSON.parse(captureCall(errorSpy)) as Record<
        string,
        unknown
      >;
      let cursor = parsed.deep as Record<string, unknown>;
      for (let i = 0; i < 4; i++) {
        cursor = cursor.nested as Record<string, unknown>;
      }
      expect(cursor.nested).toBe('[MaxDepthExceeded]');
      expect(JSON.stringify(parsed)).not.toContain('too deep');
    });

    it('does not run a plain string context value through sanitizeLogMessage (only Error.message is)', () => {
      const multiline = 'first line\nsecond line';
      logger.info('note', { text: multiline });

      const parsed = JSON.parse(captureCall(infoSpy)) as Record<
        string,
        unknown
      >;
      expect(parsed.text).toBe(multiline);
    });

    it.each([
      ['U+2028', MOCK_LINE_SEPARATOR],
      ['U+2029', MOCK_PARAGRAPH_SEPARATOR],
    ])(
      'neutralizes a raw %s in a plain string context value',
      (_name, separator) => {
        logger.error('note', { text: `first${separator}second` });

        const line = captureCall(errorSpy);
        expect(line.includes(separator)).toBe(false);

        const parsed = JSON.parse(line) as Record<string, unknown>;
        expect(parsed.text).toBe('first second');
      },
    );

    it('neutralizes U+2028/U+2029 in a string nested inside a plain object and an array', () => {
      logger.error('note', {
        details: { message: `nested${MOCK_LINE_SEPARATOR}message` },
        items: [`array${MOCK_PARAGRAPH_SEPARATOR}item`],
      });

      const line = captureCall(errorSpy);
      expect(line.includes(MOCK_LINE_SEPARATOR)).toBe(false);
      expect(line.includes(MOCK_PARAGRAPH_SEPARATOR)).toBe(false);

      const parsed = JSON.parse(line) as {
        details: { message: string };
        items: string[];
      };
      expect(parsed.details.message).toBe('nested message');
      expect(parsed.items[0]).toBe('array item');
    });

    it('does not mark a shared (non-cyclic) reference as circular', () => {
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
      const date = new Date('2024-01-01T00:00:00.000Z');

      logger.error(MIXED_TYPES_EVENT, { date });

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

      logger.error(MIXED_TYPES_EVENT, { point: new Point(1, 2) });

      const parsed = JSON.parse(captureCall(errorSpy)) as {
        point: { x: number; y: number };
      };
      expect(parsed.point).toEqual({ x: 1, y: 2 });
    });

    it('treats an Object.create(null) value as a plain object and recurses into it', () => {
      const cause = new Error(NULL_PROTO_ERROR_MESSAGE);
      const nullProtoObj: Record<string, unknown> = Object.create(
        null,
      ) as Record<string, unknown>;
      nullProtoObj.cause = cause;

      logger.error(MOCK_EVENT, { details: nullProtoObj });

      const parsed = JSON.parse(captureCall(errorSpy)) as {
        details: { cause: { message: string } };
      };
      expect(parsed.details.cause.message).toBe(NULL_PROTO_ERROR_MESSAGE);
    });
  });

  describe('with a registered sink', () => {
    let sink: ReturnType<typeof vi.fn<TLogSink>>;
    let unregister: () => void;
    let logger: ReturnType<typeof createLogger>;

    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'test');
      sink = vi.fn<TLogSink>();
      unregister = registerLogSink(sink);
      logger = createLogger({ service: MOCK_SERVICE });
    });

    afterEach(() => {
      unregister();
    });

    it('hands the sink the same error line it writes to the console', () => {
      logger.error(MOCK_EVENT, { status: 500 });

      expect(sink).toHaveBeenCalledTimes(1);
      expect(sink).toHaveBeenCalledWith(JSON.parse(captureCall(errorSpy)));
    });

    it('hands the sink the same warn line it writes to the console', () => {
      logger.warn(RETRY_EVENT, { attempt: 2 });

      expect(sink).toHaveBeenCalledTimes(1);
      expect(sink).toHaveBeenCalledWith(JSON.parse(captureCall(warnSpy)));
    });

    it('never hands info or debug lines to the sink', () => {
      logger.info(SIGNED_IN_EVENT);
      logger.debug('cache.hit');

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(debugSpy).toHaveBeenCalledTimes(1);
      expect(sink).not.toHaveBeenCalled();
    });

    it('stops handing lines to a sink once it is unregistered', () => {
      unregister();
      logger.error(MOCK_EVENT);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(sink).not.toHaveBeenCalled();
    });

    it('keeps the logging call silent when a sink throws', () => {
      sink.mockImplementation(() => {
        throw new Error('sink down');
      });

      expect(() => logger.error(MOCK_EVENT)).not.toThrow();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('keeps the logging call silent when a sink rejects', async () => {
      sink.mockRejectedValue(new Error('sink down'));

      expect(() => logger.warn(RETRY_EVENT)).not.toThrow();
      await Promise.resolve();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('still delivers to the next sink when an earlier one throws', () => {
      const healthySink = vi.fn<TLogSink>();
      const unregisterHealthy = registerLogSink(healthySink);
      sink.mockImplementation(() => {
        throw new Error('sink down');
      });

      logger.error(MOCK_EVENT);
      unregisterHealthy();

      expect(healthySink).toHaveBeenCalledTimes(1);
    });
  });
});
