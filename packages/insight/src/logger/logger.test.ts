import { registerLogSink, type TLogSink } from '@blog/insight/sink/log-sink';
import {
  MOCK_ERROR_MESSAGE,
  MOCK_EVENT,
  MOCK_LINE_SEPARATOR,
  MOCK_PARAGRAPH_SEPARATOR,
  MOCK_SEPARATORS,
  MOCK_SERVICE,
} from '@blog/insight/testing/fixtures';
import { faker } from '@faker-js/faker';

import { createLogger, LOG_LEVEL } from './logger';

faker.seed(6030);

const MOCK_NOW = new Date('2026-10-15T12:00:00.000Z');
const MOCK_TS = MOCK_NOW.toISOString();
const MOCK_USER_ID = faker.string.uuid();
const MOCK_OTHER_EVENT = 'retry.scheduled';
const MOCK_STACK = `Error: ${MOCK_ERROR_MESSAGE}\n  at frame ()`;
const MOCK_INJECTED = 'abc\ninjected';
const MOCK_FIRST_MESSAGE = faker.lorem.sentence();
const MOCK_SECOND_MESSAGE = faker.lorem.sentence();
const MOCK_NOT_AN_ERROR = faker.lorem.word();
const MOCK_SINK_FAILURE = 'sink down';
const NESTING_WITHIN_LIMIT = 4;
const NESTING_PAST_LIMIT = 5;

class MockPoint {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

function lastLine(spy: ReturnType<typeof vi.spyOn>): string {
  const call = spy.mock.calls.at(-1);
  if (!call) {
    throw new Error('console spy was not called');
  }

  return call[0] as string;
}

function parseLastLine<T = Record<string, unknown>>(
  spy: ReturnType<typeof vi.spyOn>,
): T {
  return JSON.parse(lastLine(spy)) as T;
}

function mockError(message: string): Error {
  const error = new Error(message);
  error.stack = MOCK_STACK;
  return error;
}

function nestUnder(value: unknown, levels: number): unknown {
  let nested = value;
  for (let level = 0; level < levels; level++) {
    nested = { nested };
  }

  return nested;
}

describe(createLogger, () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
    vi.stubEnv('NODE_ENV', 'test');
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('emits the base and call context as one single-line JSON object', () => {
    const logger = createLogger({ service: MOCK_SERVICE });
    logger.info(MOCK_EVENT, { userId: MOCK_USER_ID });

    const line = lastLine(infoSpy);
    expect(line.includes('\n')).toBe(false);
    expect(JSON.parse(line)).toEqual({
      service: MOCK_SERVICE,
      userId: MOCK_USER_ID,
      level: LOG_LEVEL.INFO,
      event: MOCK_EVENT,
      ts: MOCK_TS,
    });
  });

  describe('with no base context', () => {
    let logger: ReturnType<typeof createLogger>;

    beforeEach(() => {
      logger = createLogger();
    });

    it.each(Object.values(LOG_LEVEL))(
      'writes a %s line with no context through the matching console method',
      (level) => {
        logger[level](MOCK_EVENT);

        const consoleMethod = vi.mocked(console[level]);
        expect(consoleMethod).toHaveBeenCalledTimes(1);
        expect(parseLastLine(consoleMethod)).toEqual({
          level,
          event: MOCK_EVENT,
          ts: MOCK_TS,
        });
      },
    );

    it('keeps a control character in context from forging a second log line', () => {
      const forgedEntry = '"}\n{"level":"error","event":"forged"';
      const text = `first line\r\nsecond line\x00${forgedEntry}`;
      logger.error(MOCK_EVENT, { text });

      const line = lastLine(errorSpy);
      expect(line.split('\n')).toHaveLength(1);
      expect(JSON.parse(line)).toEqual({
        text,
        level: LOG_LEVEL.ERROR,
        event: MOCK_EVENT,
        ts: MOCK_TS,
      });
    });

    it('keeps its own level, event and ts over same-named context fields', () => {
      logger.error(MOCK_EVENT, {
        level: 'not-a-real-level',
        event: MOCK_OTHER_EVENT,
        ts: 'fake',
      });

      expect(parseLastLine(errorSpy)).toEqual({
        level: LOG_LEVEL.ERROR,
        event: MOCK_EVENT,
        ts: MOCK_TS,
      });
    });

    it.each([
      ['message', new Error(MOCK_INJECTED)],
      [
        'digest',
        Object.assign(new Error(MOCK_ERROR_MESSAGE), { digest: MOCK_INJECTED }),
      ],
    ])('strips control characters from an Error %s', (field, error) => {
      logger.error(MOCK_EVENT, { error });

      const { error: logged } = parseLastLine<{
        error: Record<string, string>;
      }>(errorSpy);
      expect(logged[field]).toBe('abc injected');
    });

    it('truncates a long Error stack with a marker', () => {
      const error = new Error(MOCK_ERROR_MESSAGE);
      error.stack = `${MOCK_STACK}\n${'  at fakeFrame ()\n'.repeat(500)}`;

      logger.error(MOCK_EVENT, { error });

      const {
        error: { stack },
      } = parseLastLine<{ error: { stack: string } }>(errorSpy);
      expect(stack.endsWith('...[truncated]')).toBe(true);
      expect(stack.length).toBeLessThan(error.stack.length);
    });

    it('keeps the name of an Error, and its string digest and code', () => {
      const error = Object.assign(new TypeError(MOCK_ERROR_MESSAGE), {
        digest: 'DYNAMIC_SERVER_USAGE',
        code: 'ERR_RENDER',
      });
      error.stack = MOCK_STACK;

      logger.error(MOCK_EVENT, { error });

      const { error: logged } = parseLastLine<{ error: unknown }>(errorSpy);
      expect(logged).toEqual({
        name: 'TypeError',
        message: MOCK_ERROR_MESSAGE,
        digest: 'DYNAMIC_SERVER_USAGE',
        code: 'ERR_RENDER',
        stack: MOCK_STACK,
      });
    });

    it.each([
      ['no digest or code', {}],
      ['a digest and code that are not strings', { digest: 42, code: {} }],
    ])(
      'logs an Error with %s as its name, message and stack',
      (_name, extra) => {
        const error = Object.assign(mockError(MOCK_ERROR_MESSAGE), extra);

        logger.error(MOCK_EVENT, { error });

        const { error: logged } = parseLastLine<{ error: unknown }>(errorSpy);
        expect(logged).toEqual({
          name: 'Error',
          message: MOCK_ERROR_MESSAGE,
          stack: MOCK_STACK,
        });
      },
    );

    it('omits an undefined context field', () => {
      logger.warn(MOCK_EVENT, { present: MOCK_USER_ID, missing: undefined });

      expect(parseLastLine(warnSpy)).toEqual({
        present: MOCK_USER_ID,
        level: LOG_LEVEL.WARN,
        event: MOCK_EVENT,
        ts: MOCK_TS,
      });
    });

    it('is a no-op for debug in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      logger.debug(MOCK_EVENT, { userId: MOCK_USER_ID });

      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('unwraps an Error nested inside a plain object', () => {
      logger.error(MOCK_EVENT, {
        details: { cause: mockError(MOCK_FIRST_MESSAGE) },
      });

      const { details } = parseLastLine<{ details: unknown }>(errorSpy);
      expect(details).toEqual({
        cause: {
          name: 'Error',
          message: MOCK_FIRST_MESSAGE,
          stack: MOCK_STACK,
        },
      });
    });

    it('unwraps Errors nested inside an array', () => {
      logger.error(MOCK_EVENT, {
        errors: [
          mockError(MOCK_FIRST_MESSAGE),
          mockError(MOCK_SECOND_MESSAGE),
          MOCK_NOT_AN_ERROR,
        ],
      });

      const { errors } = parseLastLine<{ errors: unknown }>(errorSpy);
      expect(errors).toEqual([
        { name: 'Error', message: MOCK_FIRST_MESSAGE, stack: MOCK_STACK },
        { name: 'Error', message: MOCK_SECOND_MESSAGE, stack: MOCK_STACK },
        MOCK_NOT_AN_ERROR,
      ]);
    });

    it('marks a cyclic reference in context as circular', () => {
      const cyclic: Record<string, unknown> = { id: MOCK_USER_ID };
      cyclic.self = cyclic;

      logger.error(MOCK_EVENT, { data: cyclic });

      const { data } = parseLastLine<{ data: unknown }>(errorSpy);
      expect(data).toEqual({ id: MOCK_USER_ID, self: '[Circular]' });
    });

    it('does not mark a shared non-cyclic reference as circular', () => {
      const shared = { id: MOCK_USER_ID };

      logger.error(MOCK_EVENT, { a: shared, b: shared });

      const { a, b } = parseLastLine<{ a: unknown; b: unknown }>(errorSpy);
      expect(a).toEqual(shared);
      expect(b).toEqual(shared);
    });

    it('unwraps an Error nested just within the depth limit', () => {
      const error = mockError(MOCK_FIRST_MESSAGE);

      logger.error(MOCK_EVENT, {
        deep: nestUnder({ error }, NESTING_WITHIN_LIMIT),
      });

      const { deep } = parseLastLine<{ deep: unknown }>(errorSpy);
      expect(deep).toEqual(
        nestUnder(
          {
            error: {
              name: 'Error',
              message: MOCK_FIRST_MESSAGE,
              stack: MOCK_STACK,
            },
          },
          NESTING_WITHIN_LIMIT,
        ),
      );
    });

    it('replaces a value nested past the depth limit with a marker', () => {
      const error = mockError(MOCK_FIRST_MESSAGE);

      logger.error(MOCK_EVENT, {
        deep: nestUnder({ error }, NESTING_PAST_LIMIT),
      });

      const { deep } = parseLastLine<{ deep: unknown }>(errorSpy);
      expect(deep).toEqual(nestUnder('[MaxDepthExceeded]', NESTING_PAST_LIMIT));
    });

    it.each(MOCK_SEPARATORS)(
      'neutralizes a raw %s in a plain string context value',
      (_name, separator) => {
        logger.error(MOCK_EVENT, { text: `first${separator}second` });

        const line = lastLine(errorSpy);
        expect(line.includes(separator)).toBe(false);

        const { text } = JSON.parse(line) as { text: string };
        expect(text).toBe('first second');
      },
    );

    it('neutralizes U+2028/U+2029 in strings nested in an object and an array', () => {
      logger.error(MOCK_EVENT, {
        details: { message: `nested${MOCK_LINE_SEPARATOR}message` },
        items: [`array${MOCK_PARAGRAPH_SEPARATOR}item`],
      });

      const line = lastLine(errorSpy);
      expect(line.includes(MOCK_LINE_SEPARATOR)).toBe(false);
      expect(line.includes(MOCK_PARAGRAPH_SEPARATOR)).toBe(false);

      const { details, items } = JSON.parse(line) as {
        details: unknown;
        items: unknown;
      };
      expect(details).toEqual({ message: 'nested message' });
      expect(items).toEqual(['array item']);
    });

    it.each([
      ['a Date', MOCK_NOW, MOCK_TS],
      ['a class instance', new MockPoint(1, 2), { x: 1, y: 2 }],
    ])(
      'passes %s in context through without recursing',
      (_name, value, expected) => {
        logger.error(MOCK_EVENT, { value });

        const { value: logged } = parseLastLine<{ value: unknown }>(errorSpy);
        expect(logged).toEqual(expected);
      },
    );

    it('recurses into an Object.create(null) value like a plain object', () => {
      const nullProto = Object.create(null) as Record<string, unknown>;
      nullProto.cause = mockError(MOCK_FIRST_MESSAGE);

      logger.error(MOCK_EVENT, { details: nullProto });

      const { details } = parseLastLine<{ details: unknown }>(errorSpy);
      expect(details).toEqual({
        cause: {
          name: 'Error',
          message: MOCK_FIRST_MESSAGE,
          stack: MOCK_STACK,
        },
      });
    });
  });

  describe('with a registered sink', () => {
    let sink: ReturnType<typeof vi.fn<TLogSink>>;
    let unregister: () => void;
    let logger: ReturnType<typeof createLogger>;

    beforeEach(() => {
      sink = vi.fn<TLogSink>();
      unregister = registerLogSink(sink);
      logger = createLogger({ service: MOCK_SERVICE });
    });

    afterEach(() => {
      unregister();
    });

    it.each([LOG_LEVEL.ERROR, LOG_LEVEL.WARN])(
      'hands the sink the same %s line it writes to the console',
      (level) => {
        logger[level](MOCK_EVENT, { userId: MOCK_USER_ID });

        expect(sink).toHaveBeenCalledTimes(1);
        expect(sink).toHaveBeenCalledWith(
          parseLastLine(vi.mocked(console[level])),
        );
      },
    );

    it('never hands info or debug lines to the sink', () => {
      logger.info(MOCK_EVENT);
      logger.debug(MOCK_EVENT);

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
        throw new Error(MOCK_SINK_FAILURE);
      });

      expect(() => logger.error(MOCK_EVENT)).not.toThrow();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('keeps the logging call silent when a sink rejects', async () => {
      sink.mockRejectedValue(new Error(MOCK_SINK_FAILURE));

      expect(() => logger.warn(MOCK_EVENT)).not.toThrow();
      await Promise.resolve();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('still delivers to the next sink when an earlier one throws', () => {
      const healthySink = vi.fn<TLogSink>();
      const unregisterHealthy = registerLogSink(healthySink);
      sink.mockImplementation(() => {
        throw new Error(MOCK_SINK_FAILURE);
      });

      logger.error(MOCK_EVENT);
      unregisterHealthy();

      expect(healthySink).toHaveBeenCalledTimes(1);
    });
  });
});
