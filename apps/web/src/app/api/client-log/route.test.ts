import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { FORWARDED_FOR_HEADER } from '@blog/utils/client-key';
import { CLIENT_LOG_LOG } from '@web/constants/client-log';
import type * as TRateLimiterModule from '@web/server/rate-limit/rate-limiter/rate-limiter';
import { logger } from '@web/utils/logger/logger';

import type * as TRoute from './route';

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

let loggerErrorMock = vi.mocked(logger.error);

const CLIENT_LOG_URL = 'https://example.com/api/client-log';
const CONTENT_LENGTH_HEADER = 'content-length';
const CLIENT_IP = '203.0.113.5';

const validPayload = {
  event: 'copy_to_clipboard.write_failed',
  message: 'clipboard write denied',
};

const postRequest = (
  body: unknown,
  init?: { headers?: Record<string, string>; raw?: string },
) => {
  const rawBody = init?.raw ?? JSON.stringify(body);

  return new Request(CLIENT_LOG_URL, {
    method: HTTP_METHOD.POST,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    body: rawBody,
  });
};

const postStreamRequest = (byteLength: number) => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(byteLength).fill(97));
      controller.close();
    },
  });

  return new Request(CLIENT_LOG_URL, {
    method: HTTP_METHOD.POST,
    headers: { 'Content-Type': 'application/json' },
    body: stream,
    duplex: 'half',
  } as RequestInit);
};

const freshRoute = async () => {
  vi.resetModules();
  const fresh = await import('@web/utils/logger/logger');
  loggerErrorMock = vi.mocked(fresh.logger.error);
  return import('./route');
};

describe('POST /api/client-log', () => {
  let POST: typeof TRoute.POST;

  beforeEach(async () => {
    loggerErrorMock.mockReset();
    ({ POST } = await freshRoute());
  });

  it('builds no rate limiter until the first request, so importing the route reads no KV credentials', async () => {
    createRateLimiterSpy.mockClear();
    const { POST: freshPost } = await freshRoute();

    expect(createRateLimiterSpy).not.toHaveBeenCalled();

    await freshPost(postRequest(validPayload));
    await freshPost(postRequest(validPayload));

    expect(createRateLimiterSpy).toHaveBeenCalledTimes(1);
  });

  it('accepts a valid payload and logs through the shared logger with source: client', async () => {
    const response = await POST(postRequest(validPayload));

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      CLIENT_LOG_LOG.REPORT_RECEIVED,
      {
        message: validPayload.message,
        clientEvent: validPayload.event,
        source: 'client',
      },
    );
  });

  it('rejects a payload with an unknown key', async () => {
    const response = await POST(
      postRequest({ ...validPayload, extra: 'nope' }),
    );

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const response = await POST(postRequest(undefined, { raw: '{not json' }));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized payload declared via Content-Length', async () => {
    const response = await POST(
      postRequest(validPayload, {
        headers: { 'Content-Length': String(9 * 1024) },
      }),
    );

    expect(response.status).toBe(413);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized payload even without a Content-Length header', async () => {
    const response = await POST(
      postRequest({ ...validPayload, message: 'a'.repeat(9000) }),
    );

    expect(response.status).toBe(413);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized streamed body with no Content-Length, without buffering it', async () => {
    const request = postStreamRequest(9 * 1024);
    expect(request.headers.get(CONTENT_LENGTH_HEADER)).toBeNull();

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('accepts a streamed body with no Content-Length that is within the payload cap', async () => {
    const body = JSON.stringify(validPayload);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      },
    });
    const request = new Request(CLIENT_LOG_URL, {
      method: HTTP_METHOD.POST,
      headers: { 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    expect(request.headers.get(CONTENT_LENGTH_HEADER)).toBeNull();

    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
  });

  it('strips control characters from the message so a payload cannot forge a log line', async () => {
    const forgedSuffix = JSON.stringify({
      level: 'error',
      event: 'fake.forged_entry',
    });

    const response = await POST(
      postRequest({
        ...validPayload,
        message: `real error\r\n${forgedSuffix}`,
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    const loggedContext = loggerErrorMock.mock.calls[0]?.[1] as {
      message: string;
    };
    expect(loggedContext.message).not.toMatch(/[\r\n]/);
  });

  it('strips the query string from a reported url before logging', async () => {
    await POST(
      postRequest({
        ...validPayload,
        url: '/blog/hello?token=super-secret',
      }),
    );

    const loggedContext = loggerErrorMock.mock.calls[0]?.[1] as {
      url: string;
    };
    expect(loggedContext.url).toBe('/blog/hello');
  });

  it('accepts 20 reports per client per minute and refuses the 21st', async () => {
    const headers = { [FORWARDED_FOR_HEADER]: CLIENT_IP };

    const statuses: number[] = [];
    for (let i = 0; i < 21; i += 1) {
      statuses.push(
        (await POST(postRequest(validPayload, { headers }))).status,
      );
    }

    expect(statuses).toEqual([...Array<number>(20).fill(204), 429]);
  });

  it('tracks rate limiting per client key, not globally', async () => {
    for (let i = 0; i < 21; i += 1) {
      await POST(
        postRequest(validPayload, {
          headers: { [FORWARDED_FOR_HEADER]: CLIENT_IP },
        }),
      );
    }

    const otherClientResponse = await POST(
      postRequest(validPayload, {
        headers: { [FORWARDED_FOR_HEADER]: '203.0.113.9' },
      }),
    );

    expect(otherClientResponse.status).toBe(HTTP_STATUS.NO_CONTENT);
  });
});
