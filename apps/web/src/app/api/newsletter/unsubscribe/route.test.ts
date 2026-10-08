import { TENANT_STATUS } from '@blog/db';
import { getTranslations } from 'next-intl/server';

export {};

const { unsubscribeByTokenMock, resolveRequestTenantMock } = vi.hoisted(() => ({
  unsubscribeByTokenMock: vi.fn(),
  resolveRequestTenantMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { subscribers: { unsubscribeByToken: unsubscribeByTokenMock } },
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: resolveRequestTenantMock,
}));

const { resolveNewsletterLinkLocaleMock } = vi.hoisted(() => ({
  resolveNewsletterLinkLocaleMock: vi.fn(),
}));

vi.mock(
  '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale',
  () => ({ resolveNewsletterLinkLocale: resolveNewsletterLinkLocaleMock }),
);

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
  let GET: typeof import('./route').GET;
  let request: Request;

  beforeEach(async () => {
    request = new Request(
      'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc',
    );
    unsubscribeByTokenMock.mockReset();
    resolveRequestTenantMock.mockReset();
    resolveNewsletterLinkLocaleMock.mockResolvedValue('EN');
    ({ GET } = await import('./route'));
  });

  it('returns 400 without touching the db when no token is given', async () => {
    const response = await GET(
      new Request('https://example.com/api/newsletter/unsubscribe'),
    );
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain('Link no longer valid');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(resolveRequestTenantMock).not.toHaveBeenCalled();
  });

  it('renders a confirmation form without touching the db for a present token', async () => {
    const response = await GET(request);
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
    expect(resolveRequestTenantMock).not.toHaveBeenCalled();
  });

  it('renders in the language the link carries and keeps it on the form', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue('FR');
    const response = await GET(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc&lang=FR',
      ),
    );
    const html = await response.text();

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith('FR');
    expect(getTranslations).toHaveBeenCalledWith({
      locale: 'FR',
      namespace: 'newsletterUnsubscribe',
    });
    expect(html).toContain('<html lang="FR">');
    expect(html).toContain('token=unsub-token-abc&amp;lang=FR');
  });
});

describe('POST /api/newsletter/unsubscribe', () => {
  let POST: typeof import('./route').POST;
  let request: Request;

  beforeEach(async () => {
    request = new Request(
      'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc',
      { method: 'POST' },
    );
    unsubscribeByTokenMock.mockReset();
    unsubscribeByTokenMock.mockResolvedValue({
      outcome: 'unsubscribed',
      subscriber,
    });
    resolveRequestTenantMock.mockReset();
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
    });
    resolveNewsletterLinkLocaleMock.mockResolvedValue('EN');
    ({ POST } = await import('./route'));
  });

  it('returns 400 without querying the db when no token is given', async () => {
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
    const response = await POST(request);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('You&apos;re unsubscribed');
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
      TENANT_ID,
      'unsub-token-abc',
    );
  });

  it('renders in the language the link carries', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue('FR');
    const response = await POST(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc&lang=FR',
        { method: 'POST' },
      ),
    );
    const html = await response.text();

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith('FR');
    expect(html).toContain('<html lang="FR">');
  });

  it('renders the calm "no longer valid" page for an unknown or already-used token', async () => {
    unsubscribeByTokenMock.mockResolvedValue({ outcome: 'not-found' });
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

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'unsubscribes and returns 200 when the tenant is %s',
    async (status) => {
      resolveRequestTenantMock.mockResolvedValue({ id: TENANT_ID, status });
      const response = await POST(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain('You&apos;re unsubscribed');
      expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
        TENANT_ID,
        'unsub-token-abc',
      );
    },
  );

  it('returns 404 with the error copy without unsubscribing when no tenant resolves', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);
    const response = await POST(request);
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('Something went wrong');
    expect(html).not.toContain('Link no longer valid');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('returns 500 with the error copy and logs when the db query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    unsubscribeByTokenMock.mockRejectedValue(new Error('db down'));
    const response = await POST(request);
    const html = await response.text();

    expect(response.status).toBe(500);
    expect(html).toContain('Something went wrong');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
