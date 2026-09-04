import { postOperatorAlert } from './post-operator-alert';

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  originalEnv['PLATFORM_APP_URL'] = process.env['PLATFORM_APP_URL'];
  originalEnv['OPERATOR_ALERT_SECRET'] = process.env['OPERATOR_ALERT_SECRET'];
  process.env['PLATFORM_APP_URL'] = 'https://platform.example.com';
  process.env['OPERATOR_ALERT_SECRET'] = 'shared-secret';
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  vi.unstubAllGlobals();
});

describe(postOperatorAlert, () => {
  it('does not throw when the platform returns 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    await expect(
      postOperatorAlert({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    await expect(
      postOperatorAlert({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    ).resolves.toBeUndefined();
  });

  it('sends the secret as a Bearer token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await postOperatorAlert({
      kind: 'OWNER_ELEVATION',
      tenantId: 't1',
      outcome: 'STALLED',
    });

    const [, init] = fetchMock.mock.calls[0] as [
      URL,
      { headers: Record<string, string>; body: string },
    ];
    expect(init.headers['Authorization']).toBe('Bearer shared-secret');
    expect(JSON.parse(init.body)).toEqual({
      kind: 'OWNER_ELEVATION',
      tenantId: 't1',
      outcome: 'STALLED',
    });
  });

  it('POSTs to /api/internal/operator-alert on the platform origin', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await postOperatorAlert({
      kind: 'DOCUMENT_VALIDATION',
      tenantId: 't1',
      invalidDocumentCount: 2,
      isCritical: true,
    });

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.toString()).toBe(
      'https://platform.example.com/api/internal/operator-alert',
    );
  });

  it('does not call fetch and resolves when PLATFORM_APP_URL is unset', async () => {
    delete process.env['PLATFORM_APP_URL'];
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      postOperatorAlert({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not call fetch and resolves when OPERATOR_ALERT_SECRET is unset', async () => {
    delete process.env['OPERATOR_ALERT_SECRET'];
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      postOperatorAlert({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
