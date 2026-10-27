import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { FORWARDED_FOR_HEADER } from '@blog/utils/client-key';
import { faker } from '@faker-js/faker';
import { CLIENT_LOG_LOG } from '@web/constants/client-log';
import type * as TRateLimiterModule from '@web/server/rate-limit/rate-limiter/rate-limiter';
import { logger } from '@web/utils/logger/logger';

import { POST } from './route';

const { createRateLimiterSpy } = vi.hoisted(() => ({
  createRateLimiterSpy: vi.fn(),
}));

vi.mock(
  '@web/server/rate-limit/rate-limiter/rate-limiter',
  async (importOriginal) => {
    const actual = await importOriginal<typeof TRateLimiterModule>();
    createRateLimiterSpy.mockImplementation(actual.createRateLimiter);
    return { createRateLimiter: createRateLimiterSpy };
  },
);

faker.seed(6009);

const PAYLOAD_TOO_LARGE_STATUS = 413;
const PAYLOAD_CAP_BYTES = 8 * 1024;
const REPORTS_PER_MINUTE = 20;
const CONTENT_LENGTH_HEADER = 'content-length';
const MOCK_CLIENT_LOG_URL = faker.internet.url({ appendSlash: false });

const MOCK_PAYLOAD = {
  event: `${faker.lorem.word()}.${faker.lorem.word()}`,
  message: faker.lorem.sentence(),
};

const MOCK_FORGED_ENTRY = JSON.stringify({
  level: 'error',
  event: faker.lorem.word(),
});
const MOCK_PATH = `/${faker.lorem.word()}/${faker.lorem.word()}`;
const MOCK_QUERY = `token=${faker.string.alphanumeric(12)}`;

const streamOf = (bytes: Uint8Array): ReadableStream<Uint8Array> =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

describe(POST, () => {
  let clientIp: string;

  const buildRequest = (
    body: BodyInit,
    headers: Record<string, string> = {},
  ): Request =>
    new Request(MOCK_CLIENT_LOG_URL, {
      method: HTTP_METHOD.POST,
      headers: {
        'Content-Type': 'application/json',
        [FORWARDED_FOR_HEADER]: clientIp,
        ...headers,
      },
      body,
      ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
    } as RequestInit);

  const jsonRequest = (
    payload: unknown = MOCK_PAYLOAD,
    headers?: Record<string, string>,
  ): Request => buildRequest(JSON.stringify(payload), headers);

  beforeEach(() => {
    clientIp = faker.internet.ipv4();
  });

  it('builds no rate limiter until the first request, and then only one', async () => {
    vi.resetModules();
    createRateLimiterSpy.mockClear();
    const { POST: freshPost } = await import('./route');

    expect(createRateLimiterSpy).not.toHaveBeenCalled();

    await freshPost(jsonRequest());
    await freshPost(jsonRequest());

    expect(createRateLimiterSpy).toHaveBeenCalledTimes(1);
  });

  it('accepts a valid payload and logs it with source: client', async () => {
    const response = await POST(jsonRequest());

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(logger.error).toHaveBeenCalledWith(CLIENT_LOG_LOG.REPORT_RECEIVED, {
      message: MOCK_PAYLOAD.message,
      clientEvent: MOCK_PAYLOAD.event,
      source: 'client',
    });
  });

  it('logs the sanitized report so a payload cannot forge a log line', async () => {
    const response = await POST(
      jsonRequest({
        ...MOCK_PAYLOAD,
        message: `${MOCK_PAYLOAD.message}\r\n${MOCK_FORGED_ENTRY}`,
        url: `${MOCK_PATH}?${MOCK_QUERY}`,
      }),
    );
    const [, loggedContext] = vi.mocked(logger.error).mock.calls[0] ?? [];

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(loggedContext?.['message']).not.toMatch(/[\r\n]/);
    expect(loggedContext?.['url']).toBe(MOCK_PATH);
  });

  it.each([
    [
      'a payload with an unknown key',
      () => jsonRequest({ ...MOCK_PAYLOAD, extra: 'x' }),
    ],
    ['malformed JSON', () => buildRequest('{not json')],
  ])('rejects %s', async (_case, createRequest) => {
    const response = await POST(createRequest());

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each([
    [
      'declared via Content-Length',
      () =>
        jsonRequest(MOCK_PAYLOAD, {
          'Content-Length': String(PAYLOAD_CAP_BYTES + 1),
        }),
    ],
    [
      'without a Content-Length header',
      () =>
        jsonRequest({
          ...MOCK_PAYLOAD,
          message: faker.string.alpha(PAYLOAD_CAP_BYTES + 1),
        }),
    ],
    [
      'streamed with no Content-Length',
      () => buildRequest(streamOf(new Uint8Array(PAYLOAD_CAP_BYTES + 1))),
    ],
  ])('rejects an oversized payload %s', async (_case, createRequest) => {
    const request = createRequest();

    const response = await POST(request);

    expect(response.status).toBe(PAYLOAD_TOO_LARGE_STATUS);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('accepts a streamed body with no Content-Length within the payload cap', async () => {
    const request = buildRequest(
      streamOf(new TextEncoder().encode(JSON.stringify(MOCK_PAYLOAD))),
    );

    const response = await POST(request);

    expect(request.headers.get(CONTENT_LENGTH_HEADER)).toBeNull();
    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
  });

  it('refuses a client once it exceeds the per-minute report limit', async () => {
    const statuses: number[] = [];
    for (let i = 0; i <= REPORTS_PER_MINUTE; i += 1) {
      statuses.push((await POST(jsonRequest())).status);
    }

    expect(statuses).toEqual([
      ...Array<number>(REPORTS_PER_MINUTE).fill(HTTP_STATUS.NO_CONTENT),
      HTTP_STATUS.TOO_MANY_REQUESTS,
    ]);
  });

  it('tracks rate limiting per client key, not globally', async () => {
    for (let i = 0; i <= REPORTS_PER_MINUTE; i += 1) {
      await POST(jsonRequest());
    }

    const otherClientResponse = await POST(
      jsonRequest(MOCK_PAYLOAD, {
        [FORWARDED_FOR_HEADER]: faker.internet.ipv4(),
      }),
    );

    expect(otherClientResponse.status).toBe(HTTP_STATUS.NO_CONTENT);
  });
});
