import { LOG_LEVEL } from '@blog/insight/logger/logger';
import { MOCK_EVENT, MOCK_SERVICE } from '@blog/insight/testing/fixtures';
import { faker } from '@faker-js/faker';

import { createLokiSink } from './loki-sink';

faker.seed(6030);

const MOCK_PUSH_URL = faker.internet.url();
const MOCK_USER = '123456';
const MOCK_TOKEN = 'glc_token';

const MOCK_LINE_NANOSECONDS = '1792065600000000000';

const MOCK_LINE = {
  service: MOCK_SERVICE,
  level: LOG_LEVEL.ERROR,
  event: MOCK_EVENT,
  status: 500,
  ts: '2026-10-15T12:00:00.000Z',
};

describe(createLokiSink, () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
  let push: NonNullable<ReturnType<typeof createLokiSink>>;

  const sentBody = (): unknown => {
    const [, init] = fetchMock.mock.calls[0] ?? [];
    return JSON.parse(String(init?.body));
  };

  beforeEach(() => {
    fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const sink = createLokiSink({
      url: MOCK_PUSH_URL,
      user: MOCK_USER,
      token: MOCK_TOKEN,
    });
    if (!sink) {
      throw new Error('expected a sink');
    }
    push = sink;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each([
    ['user', { user: '123\u201d', token: MOCK_TOKEN }],
    ['token', { user: MOCK_USER, token: '\u201cglc_token\u201d' }],
  ])('creates no sink when the %s cannot be encoded', (_field, credentials) => {
    expect(
      createLokiSink({ url: MOCK_PUSH_URL, ...credentials }),
    ).toBeUndefined();
  });

  it('posts the line to the push URL with basic auth', async () => {
    await push(MOCK_LINE);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(MOCK_PUSH_URL);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({
      Authorization: 'Basic MTIzNDU2OmdsY190b2tlbg==',
      'Content-Type': 'application/json',
    });
  });

  it('sends one stream labelled by service and level, carrying the whole line', async () => {
    await push(MOCK_LINE);

    expect(sentBody()).toEqual({
      streams: [
        {
          stream: { service: MOCK_SERVICE, level: LOG_LEVEL.ERROR },
          values: [[MOCK_LINE_NANOSECONDS, JSON.stringify(MOCK_LINE)]],
        },
      ],
    });
  });

  it('leaves out a service label the line does not carry', async () => {
    const lineWithoutService = { ...MOCK_LINE, service: undefined };
    await push(lineWithoutService);

    expect(sentBody()).toEqual({
      streams: [
        {
          stream: { level: LOG_LEVEL.ERROR },
          values: [[MOCK_LINE_NANOSECONDS, JSON.stringify(lineWithoutService)]],
        },
      ],
    });
  });

  it('resolves when Loki answers with a non-2xx status', async () => {
    fetchMock.mockResolvedValue(new Response('quota', { status: 429 }));

    await expect(push(MOCK_LINE)).resolves.toBeUndefined();
  });

  it('resolves when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(push(MOCK_LINE)).resolves.toBeUndefined();
  });

  it('releases a push Loki never answers after five seconds, not before', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(init.signal?.reason);
          });
        }),
    );
    let settled = false;

    const pushed = push(MOCK_LINE).then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(4_999);
    const settledBeforeTimeout = settled;
    await vi.advanceTimersByTimeAsync(1);
    await pushed;

    expect(settledBeforeTimeout).toBe(false);
    expect(settled).toBe(true);
  });
});
