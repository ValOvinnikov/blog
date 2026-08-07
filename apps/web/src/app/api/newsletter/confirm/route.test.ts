export {};

const { confirmSubscriberMock } = vi.hoisted(() => ({
  confirmSubscriberMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { subscribers: { confirmSubscriber: confirmSubscriberMock } },
}));

const subscriber = {
  id: 'sub-1',
  email: 'reader@example.com',
  status: 'active' as const,
  confirmationToken: 'token-abc',
  subscribedAt: new Date('2026-01-01'),
  confirmedAt: new Date('2026-01-02'),
};

describe('GET /api/newsletter/confirm', () => {
  beforeEach(() => {
    confirmSubscriberMock.mockReset();
  });

  it('returns 400 without querying the db when no token is given', async () => {
    const { GET } = await import('./route');

    const response = await GET(
      new Request('https://example.com/api/newsletter/confirm'),
    );

    expect(response.status).toBe(400);
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('confirms the subscriber and returns 200 for a valid token', async () => {
    confirmSubscriberMock.mockResolvedValue({
      outcome: 'confirmed',
      subscriber,
    });
    const { GET } = await import('./route');

    const response = await GET(
      new Request('https://example.com/api/newsletter/confirm?token=token-abc'),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/html; charset=utf-8',
    );
    expect(html).toContain('Subscription confirmed');
    expect(confirmSubscriberMock).toHaveBeenCalledWith('token-abc');
  });

  it('treats an already-confirmed token as success (idempotent)', async () => {
    confirmSubscriberMock.mockResolvedValue({
      outcome: 'already-confirmed',
      subscriber,
    });
    const { GET } = await import('./route');

    const response = await GET(
      new Request('https://example.com/api/newsletter/confirm?token=token-abc'),
    );

    expect(response.status).toBe(200);
  });

  it('returns 404 for an unrecognized token', async () => {
    confirmSubscriberMock.mockResolvedValue({ outcome: 'not-found' });
    const { GET } = await import('./route');

    const response = await GET(
      new Request('https://example.com/api/newsletter/confirm?token=bogus'),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('Invalid confirmation link');
  });

  it('returns 500 and logs when the db query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    confirmSubscriberMock.mockRejectedValue(new Error('db down'));
    const { GET } = await import('./route');

    const response = await GET(
      new Request('https://example.com/api/newsletter/confirm?token=token-abc'),
    );

    expect(response.status).toBe(500);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
