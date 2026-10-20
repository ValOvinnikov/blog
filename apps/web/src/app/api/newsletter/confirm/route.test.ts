import { TENANT_WRITE_REFUSAL } from '@blog/config';

export {};

const {
  confirmSubscriberMock,
  resolveWritableTenantMock,
  resolveNewsletterLinkLocaleMock,
} = vi.hoisted(() => ({
  confirmSubscriberMock: vi.fn(),
  resolveWritableTenantMock: vi.fn(),
  resolveNewsletterLinkLocaleMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { subscribers: { confirmSubscriber: confirmSubscriberMock } },
}));

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
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
  subscribedAt: new Date('2026-01-01'),
  confirmedAt: new Date('2026-01-02'),
};

describe('GET /api/newsletter/confirm', () => {
  let GET: typeof import('./route').GET;
  let request: Request;

  beforeEach(async () => {
    request = new Request(
      'https://example.com/api/newsletter/confirm?token=token-abc',
    );
    confirmSubscriberMock.mockReset();
    confirmSubscriberMock.mockResolvedValue({
      outcome: 'confirmed',
      subscriber,
    });
    resolveWritableTenantMock.mockReset();
    resolveWritableTenantMock.mockResolvedValue({
      ok: true,
      tenantId: TENANT_ID,
    });
    resolveNewsletterLinkLocaleMock.mockReset();
    resolveNewsletterLinkLocaleMock.mockResolvedValue({
      locale: 'EN',
      defaultLocale: 'EN',
    });
    ({ GET } = await import('./route'));
  });

  it('confirms the subscriber and sends them to the confirmed page', async () => {
    const response = await GET(request);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/confirmed',
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(confirmSubscriberMock).toHaveBeenCalledWith(TENANT_ID, 'token-abc');
  });

  it('sends them to the page in the language the link carries', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue({
      locale: 'FR',
      defaultLocale: 'EN',
    });
    const response = await GET(
      new Request(
        'https://example.com/api/newsletter/confirm?token=token-abc&lang=FR',
      ),
    );

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith('FR');
    expect(response.headers.get('location')).toBe(
      'https://example.com/fr/newsletter/confirmed',
    );
  });

  it('resolves the language of a link sent without one', async () => {
    await GET(request);

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(null);
  });

  it('treats an already-confirmed token as success', async () => {
    confirmSubscriberMock.mockResolvedValue({
      outcome: 'already-confirmed',
      subscriber,
    });
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/confirmed',
    );
  });

  it('sends a link without a token to the invalid page without querying the db', async () => {
    const response = await GET(
      new Request('https://example.com/api/newsletter/confirm'),
    );

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/confirm-invalid',
    );
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('sends an unrecognized token to the invalid page', async () => {
    confirmSubscriberMock.mockResolvedValue({ outcome: 'not-found' });
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/confirm-invalid',
    );
  });

  it('sends an inactive tenant to the unavailable page without confirming', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.INACTIVE,
    });
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/confirm-unavailable',
    );
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('sends them to the failed page without querying the db when no tenant resolves', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/confirm-failed',
    );
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('sends them to the failed page and logs when the db query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    confirmSubscriberMock.mockRejectedValue(new Error('db down'));
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/confirm-failed',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.confirm_failed'),
    );
    errorSpy.mockRestore();
  });
});
