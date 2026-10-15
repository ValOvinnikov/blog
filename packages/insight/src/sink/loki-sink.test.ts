import { createLokiSink } from './loki-sink';

const PUSH_URL = 'https://logs-prod-012.grafana.net/loki/api/v1/push';

const LINE = {
  service: 'web',
  level: 'error',
  event: 'request.failed',
  status: 500,
  ts: '2026-10-15T12:00:00.000Z',
};

describe(createLokiSink, () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
  let push: ReturnType<typeof createLokiSink>;

  const sentBody = (): unknown => {
    const [, init] = fetchMock.mock.calls[0] ?? [];
    return JSON.parse(String(init?.body));
  };

  beforeEach(() => {
    fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    push = createLokiSink({
      url: PUSH_URL,
      user: '123456',
      token: 'glc_token',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the line to the push URL with basic auth', async () => {
    await push(LINE);

    expect(fetchMock).toHaveBeenCalledWith(
      PUSH_URL,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Basic MTIzNDU2OmdsY190b2tlbg==',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('sends one stream labelled by service and level, carrying the whole line', async () => {
    await push(LINE);

    expect(sentBody()).toEqual({
      streams: [
        {
          stream: { service: 'web', level: 'error' },
          values: [['1792065600000000000', JSON.stringify(LINE)]],
        },
      ],
    });
  });

  it('leaves out a service label the line does not carry', async () => {
    await push({ ...LINE, service: undefined });

    expect(sentBody()).toMatchObject({
      streams: [{ stream: { level: 'error' } }],
    });
    expect(JSON.stringify(sentBody())).not.toContain('"service"');
  });

  it('resolves when Loki answers with a non-2xx status', async () => {
    fetchMock.mockResolvedValue(new Response('quota', { status: 429 }));

    await expect(push(LINE)).resolves.toBeUndefined();
  });

  it('resolves when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(push(LINE)).resolves.toBeUndefined();
  });
});
