import { TENANT_WRITE_REFUSAL } from '@blog/config';
import { getLocale } from 'next-intl/server';

export {};

const { confirmSubscriberMock, resolveWritableTenantMock } = vi.hoisted(() => ({
  confirmSubscriberMock: vi.fn(),
  resolveWritableTenantMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { subscribers: { confirmSubscriber: confirmSubscriberMock } },
}));

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
}));

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
    ({ GET } = await import('./route'));
  });

  it('returns 400 without querying the db when no token is given', async () => {
    const response = await GET(
      new Request('https://example.com/api/newsletter/confirm'),
    );

    expect(response.status).toBe(400);
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('confirms the subscriber and returns 200 for a valid token', async () => {
    const response = await GET(request);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/html; charset=utf-8',
    );
    expect(html).toContain('Subscription confirmed');
    expect(confirmSubscriberMock).toHaveBeenCalledWith(TENANT_ID, 'token-abc');
  });

  it('declares <html lang> as the resolved request locale, not a hardcoded value', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce('fr');
    const response = await GET(request);
    const html = await response.text();

    expect(html).toContain('<html lang="fr">');
  });

  it('treats an already-confirmed token as success (idempotent)', async () => {
    confirmSubscriberMock.mockResolvedValue({
      outcome: 'already-confirmed',
      subscriber,
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('returns 404 for an unrecognized token', async () => {
    confirmSubscriberMock.mockResolvedValue({ outcome: 'not-found' });
    const response = await GET(
      new Request('https://example.com/api/newsletter/confirm?token=bogus'),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('Invalid confirmation link');
  });

  it('returns 403 with the unavailable copy without confirming when the tenant is not ACTIVE', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.INACTIVE,
    });
    const response = await GET(request);
    const html = await response.text();

    expect(response.status).toBe(403);
    expect(html).toContain('Can&apos;t confirm right now');
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('returns 404 with the error copy without querying the db when no tenant resolves', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });
    const response = await GET(request);
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('Something went wrong');
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('returns 500 and logs when the db query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    confirmSubscriberMock.mockRejectedValue(new Error('db down'));
    const response = await GET(request);

    expect(response.status).toBe(500);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
