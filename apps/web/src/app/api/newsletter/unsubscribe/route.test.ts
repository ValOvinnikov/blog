import { TENANT_STATUS } from '@blog/db';
import { getTranslations } from 'next-intl/server';

export {};

const {
  unsubscribeByTokenMock,
  resolveRequestTenantMock,
  resolveNewsletterLinkLocaleMock,
} = vi.hoisted(() => ({
  unsubscribeByTokenMock: vi.fn(),
  resolveRequestTenantMock: vi.fn(),
  resolveNewsletterLinkLocaleMock: vi.fn(),
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

beforeEach(() => {
  unsubscribeByTokenMock.mockReset();
  resolveRequestTenantMock.mockReset();
  resolveNewsletterLinkLocaleMock.mockReset();
  resolveNewsletterLinkLocaleMock.mockResolvedValue({
    locale: 'EN',
    defaultLocale: 'EN',
  });
});

describe('GET /api/newsletter/unsubscribe', () => {
  let GET: typeof import('./route').GET;
  let request: Request;

  beforeEach(async () => {
    request = new Request(
      'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc',
    );
    ({ GET } = await import('./route'));
  });

  it('sends a link without a token to the invalid page without touching the db', async () => {
    const response = await GET(
      new Request('https://example.com/api/newsletter/unsubscribe'),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-invalid',
    );
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
    resolveNewsletterLinkLocaleMock.mockResolvedValue({
      locale: 'FR',
      defaultLocale: 'EN',
    });
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
    unsubscribeByTokenMock.mockResolvedValue({
      outcome: 'unsubscribed',
      subscriber,
    });
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
    });
    ({ POST } = await import('./route'));
  });

  it('unsubscribes and sends them to the unsubscribed page with a GET', async () => {
    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribed',
    );
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
      TENANT_ID,
      'unsub-token-abc',
    );
  });

  it('sends them to the page in the language the link carries', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue({
      locale: 'FR',
      defaultLocale: 'EN',
    });
    const response = await POST(
      new Request(
        'https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc&lang=FR',
        { method: 'POST' },
      ),
    );

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith('FR');
    expect(response.headers.get('location')).toBe(
      'https://example.com/fr/newsletter/unsubscribed',
    );
  });

  it('sends a link without a token to the invalid page without querying the db', async () => {
    const response = await POST(
      new Request('https://example.com/api/newsletter/unsubscribe', {
        method: 'POST',
      }),
    );

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-invalid',
    );
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('sends an unknown or already-used token to the invalid page', async () => {
    unsubscribeByTokenMock.mockResolvedValue({ outcome: 'not-found' });
    const response = await POST(request);

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-invalid',
    );
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'unsubscribes when the tenant is %s',
    async (status) => {
      resolveRequestTenantMock.mockResolvedValue({ id: TENANT_ID, status });
      const response = await POST(request);

      expect(response.headers.get('location')).toBe(
        'https://example.com/newsletter/unsubscribed',
      );
      expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
        TENANT_ID,
        'unsub-token-abc',
      );
    },
  );

  it('sends them to the failed page without unsubscribing when no tenant resolves', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    resolveRequestTenantMock.mockResolvedValue(undefined);
    const response = await POST(request);

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-failed',
    );
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('sends them to the failed page and logs when the db query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    unsubscribeByTokenMock.mockRejectedValue(new Error('db down'));
    const response = await POST(request);

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-failed',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.unsubscribe_link_failed'),
    );
    errorSpy.mockRestore();
  });
});
