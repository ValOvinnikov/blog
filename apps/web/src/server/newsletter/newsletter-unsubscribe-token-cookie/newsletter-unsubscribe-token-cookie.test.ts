import {
  clearNewsletterUnsubscribeToken,
  readNewsletterUnsubscribeToken,
  storeNewsletterUnsubscribeToken,
} from './newsletter-unsubscribe-token-cookie';

const { setMock, getMock, deleteMock, cookiesMock } = vi.hoisted(() => ({
  setMock: vi.fn(),
  getMock: vi.fn(),
  deleteMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

beforeEach(() => {
  cookiesMock.mockResolvedValue({
    set: setMock,
    get: getMock,
    delete: deleteMock,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe(storeNewsletterUnsubscribeToken, () => {
  it('keeps the token in a short-lived, strict, httpOnly cookie scoped to the unsubscribe endpoint', async () => {
    await storeNewsletterUnsubscribeToken('unsubscribe-token');

    expect(setMock).toHaveBeenCalledWith(
      'newsletter_unsubscribe_token',
      'unsubscribe-token',
      expect.objectContaining({
        maxAge: 60 * 60,
        path: '/api/newsletter/unsubscribe',
        sameSite: 'strict',
        httpOnly: true,
      }),
    );
  });

  it('marks the cookie secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await storeNewsletterUnsubscribeToken('unsubscribe-token');

    expect(setMock).toHaveBeenCalledWith(
      'newsletter_unsubscribe_token',
      'unsubscribe-token',
      expect.objectContaining({ secure: true }),
    );
  });
});

describe(readNewsletterUnsubscribeToken, () => {
  it('reads the kept token', async () => {
    getMock.mockReturnValue({ value: 'unsubscribe-token' });

    await expect(readNewsletterUnsubscribeToken()).resolves.toBe(
      'unsubscribe-token',
    );
    expect(getMock).toHaveBeenCalledWith('newsletter_unsubscribe_token');
  });

  it('answers undefined when no token is kept', async () => {
    getMock.mockReturnValue(undefined);

    await expect(readNewsletterUnsubscribeToken()).resolves.toBeUndefined();
  });
});

describe(clearNewsletterUnsubscribeToken, () => {
  it('deletes the cookie on the path it was set on', async () => {
    await clearNewsletterUnsubscribeToken();

    expect(deleteMock).toHaveBeenCalledWith({
      name: 'newsletter_unsubscribe_token',
      path: '/api/newsletter/unsubscribe',
    });
  });
});
