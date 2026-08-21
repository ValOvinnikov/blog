export {};

const { loggerErrorMock } = vi.hoisted(() => ({
  loggerErrorMock: vi.fn(),
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: loggerErrorMock,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const validPayload = {
  event: 'copy_to_clipboard.write_failed',
  message: 'clipboard write denied',
};

const postRequest = (
  body: unknown,
  init?: { headers?: Record<string, string>; raw?: string },
) => {
  const rawBody = init?.raw ?? JSON.stringify(body);

  return new Request('https://example.com/api/client-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    body: rawBody,
  });
};

// Simulates a genuine chunked-transfer request: a `ReadableStream` body has
// no synchronously-known length, so unlike `postRequest`'s plain string
// body, the runtime never populates a `content-length` header for it at
// all — this is the shape the pre-read byte-cap enforcement exists for.
const postStreamRequest = (byteLength: number) => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(byteLength).fill(97));
      controller.close();
    },
  });

  return new Request('https://example.com/api/client-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: stream,
    duplex: 'half',
  } as RequestInit);
};

const freshRoute = async () => {
  vi.resetModules();
  return import('./route');
};

describe('POST /api/client-log', () => {
  beforeEach(() => {
    loggerErrorMock.mockReset();
  });

  it('accepts a valid payload and logs through the shared logger with source: client', async () => {
    const { POST } = await freshRoute();

    const response = await POST(postRequest(validPayload));

    expect(response.status).toBe(204);
    expect(loggerErrorMock).toHaveBeenCalledWith('client_log.report_received', {
      message: 'clipboard write denied',
      clientEvent: 'copy_to_clipboard.write_failed',
      source: 'client',
    });
  });

  it('rejects a payload with an unknown key', async () => {
    const { POST } = await freshRoute();

    const response = await POST(
      postRequest({ ...validPayload, extra: 'nope' }),
    );

    expect(response.status).toBe(400);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const { POST } = await freshRoute();

    const response = await POST(postRequest(undefined, { raw: '{not json' }));

    expect(response.status).toBe(400);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized payload declared via Content-Length', async () => {
    const { POST } = await freshRoute();

    const response = await POST(
      postRequest(validPayload, {
        headers: { 'Content-Length': String(9 * 1024) },
      }),
    );

    expect(response.status).toBe(413);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized payload even without a Content-Length header', async () => {
    const { POST } = await freshRoute();

    const response = await POST(
      postRequest({ ...validPayload, message: 'a'.repeat(9000) }),
    );

    expect(response.status).toBe(413);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized streamed body with no Content-Length at all, without buffering it first', async () => {
    const { POST } = await freshRoute();
    const request = postStreamRequest(9 * 1024);
    expect(request.headers.get('content-length')).toBeNull();

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('accepts a streamed body with no Content-Length that is within the payload cap', async () => {
    const { POST } = await freshRoute();
    const body = JSON.stringify(validPayload);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      },
    });
    const request = new Request('https://example.com/api/client-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    expect(request.headers.get('content-length')).toBeNull();

    const response = await POST(request);

    expect(response.status).toBe(204);
  });

  it('strips control characters from the message before logging, so a payload cannot forge a log entry', async () => {
    const { POST } = await freshRoute();
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

    expect(response.status).toBe(204);
    const loggedContext = loggerErrorMock.mock.calls[0]?.[1] as {
      message: string;
    };
    expect(loggedContext.message).not.toMatch(/[\r\n]/);
  });

  it('strips the query string from a reported url before logging', async () => {
    const { POST } = await freshRoute();

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

  it('rate-limits a client that floods the endpoint', async () => {
    const { POST } = await freshRoute();
    const headers = { 'x-forwarded-for': '203.0.113.5' };

    let lastResponse;
    for (let i = 0; i < 21; i += 1) {
      lastResponse = await POST(postRequest(validPayload, { headers }));
    }

    expect(lastResponse?.status).toBe(429);
  });

  it('tracks rate limiting per client key, not globally', async () => {
    const { POST } = await freshRoute();

    for (let i = 0; i < 21; i += 1) {
      await POST(
        postRequest(validPayload, {
          headers: { 'x-forwarded-for': '203.0.113.5' },
        }),
      );
    }

    const otherClientResponse = await POST(
      postRequest(validPayload, {
        headers: { 'x-forwarded-for': '203.0.113.9' },
      }),
    );

    expect(otherClientResponse.status).toBe(204);
  });
});
