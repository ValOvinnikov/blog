export {};

const { unsubscribeByTokenMock, resolveTenantIdMock, isTenantActiveMock } =
  vi.hoisted(() => ({
    unsubscribeByTokenMock: vi.fn(),
    resolveTenantIdMock: vi.fn(),
    isTenantActiveMock: vi.fn(),
  }));

vi.mock('@blog/db', () => ({
  queries: { subscribers: { unsubscribeByToken: unsubscribeByTokenMock } },
}));

vi.mock('@web/server/tenant/resolve-tenant-id', () => ({
  resolveTenantId: resolveTenantIdMock,
}));

vi.mock('@web/server/tenant/is-tenant-active', () => ({
  isTenantActive: isTenantActiveMock,
}));

const TENANT_ID = 'tenant-1';

const subscriber = {
  id: 'sub-1',
  email: 'reader@example.com',
  status: 'active' as const,
  confirmationToken: 'token-abc',
  unsubscribeToken: 'unsub-token-abc',
  subscribedAt: new Date('2026-01-01'),
  confirmedAt: new Date('2026-01-02'),
};

describe('GET /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    unsubscribeByTokenMock.mockReset();
    resolveTenantIdMock.mockReset();
    isTenantActiveMock.mockReset();
  });

  it('returns 400 without touching the db when no token is given', async () => {
    const { GET } = await import('./route');

    const response = await GET(
      new Request('https://example.com/api/newsletter/unsubscribe'),
    );
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain('Link no longer valid');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(resolveTenantIdMock).not.toHaveBeenCalled();
  });

  it('renders a confirmation form without touching the db for a present token', async () => {
    const { GET } = await import('./route');

    const response = await GET(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc',
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/html; charset=utf-8',
    );
    expect(html).toContain('<form method="post"');
    expect(html).toContain('token=unsub-token-abc');
    expect(html).toContain('Confirm unsubscribe');
    expect(html).toContain('<a href="/">Return home</a>');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(resolveTenantIdMock).not.toHaveBeenCalled();
    expect(isTenantActiveMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    unsubscribeByTokenMock.mockReset();
    resolveTenantIdMock.mockReset();
    resolveTenantIdMock.mockResolvedValue(TENANT_ID);
    isTenantActiveMock.mockReset();
    isTenantActiveMock.mockResolvedValue(true);
  });

  it('returns 400 without querying the db when no token is given', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      new Request('https://example.com/api/newsletter/unsubscribe', {
        method: 'POST',
      }),
    );
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain('Link no longer valid');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('unsubscribes and returns 200 for a valid token', async () => {
    unsubscribeByTokenMock.mockResolvedValue({
      outcome: 'unsubscribed',
      subscriber,
    });
    const { POST } = await import('./route');

    const response = await POST(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc',
        { method: 'POST' },
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('You&apos;re unsubscribed');
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
      TENANT_ID,
      'unsub-token-abc',
    );
  });

  it('resolves the tenant from the request Host header', async () => {
    unsubscribeByTokenMock.mockResolvedValue({
      outcome: 'unsubscribed',
      subscriber,
    });
    const { POST } = await import('./route');

    await POST(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc',
        { method: 'POST', headers: { host: 'acme.example.com' } },
      ),
    );

    expect(resolveTenantIdMock).toHaveBeenCalledWith('acme.example.com');
  });

  it('renders the calm "no longer valid" page for an unknown or already-used token', async () => {
    unsubscribeByTokenMock.mockResolvedValue({ outcome: 'not-found' });
    const { POST } = await import('./route');

    const response = await POST(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=bogus',
        { method: 'POST' },
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Link no longer valid');
  });

  it('renders the calm page without unsubscribing when the resolved tenant is not ACTIVE', async () => {
    isTenantActiveMock.mockResolvedValue(false);
    const { POST } = await import('./route');

    const response = await POST(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc',
        { method: 'POST' },
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Link no longer valid');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('renders the calm page without unsubscribing when no tenant resolves', async () => {
    resolveTenantIdMock.mockResolvedValue(undefined);
    const { POST } = await import('./route');

    const response = await POST(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc',
        { method: 'POST' },
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Link no longer valid');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('renders the calm page and logs when the db query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    unsubscribeByTokenMock.mockRejectedValue(new Error('db down'));
    const { POST } = await import('./route');

    const response = await POST(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc',
        { method: 'POST' },
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Link no longer valid');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
