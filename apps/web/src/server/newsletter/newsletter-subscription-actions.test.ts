export {};

const {
  authMock,
  unsubscribeMock,
  resendConfirmationMock,
  sendEmailMock,
  clearNewsletterSubscribedCookieMock,
  getRequestTenantIdMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  unsubscribeMock: vi.fn(),
  resendConfirmationMock: vi.fn(),
  sendEmailMock: vi.fn(),
  clearNewsletterSubscribedCookieMock: vi.fn(),
  getRequestTenantIdMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    subscribers: {
      unsubscribe: unsubscribeMock,
      resendConfirmation: resendConfirmationMock,
    },
  },
}));

vi.mock('@web/server/email/send-email', () => ({
  sendEmail: sendEmailMock,
}));

vi.mock('@web/server/newsletter/newsletter-subscribed-cookie', () => ({
  clearNewsletterSubscribedCookie: clearNewsletterSubscribedCookieMock,
}));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

const TENANT_ID = 'tenant-1';

// The real `@t3-oss/env-nextjs` module throws when a server var is read
// under jsdom — mock it the same way `newsletter-actions.test.ts` does.
vi.mock('@web/utils/env/env', () => ({
  env: {
    NEWSLETTER_FROM_ADDRESS: undefined,
    NEXT_PUBLIC_SITE_URL: 'https://example.com',
  },
}));

const session = {
  user: { id: 'user-1', email: 'val@icloud.com' },
};

describe('unsubscribeAction', () => {
  beforeEach(() => {
    authMock.mockReset();
    unsubscribeMock.mockReset();
    clearNewsletterSubscribedCookieMock.mockReset();
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT_ID);
  });

  it('returns { ok: false } without unsubscribing when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({ ok: false });
    expect(unsubscribeMock).not.toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without unsubscribing when no tenant resolves', async () => {
    authMock.mockResolvedValue(session);
    getRequestTenantIdMock.mockResolvedValue(undefined);
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({ ok: false });
    expect(unsubscribeMock).not.toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('unsubscribes the session user, clears the cookie, and returns { ok: true }', async () => {
    authMock.mockResolvedValue(session);
    unsubscribeMock.mockResolvedValue(undefined);
    clearNewsletterSubscribedCookieMock.mockResolvedValue(undefined);
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({ ok: true });
    expect(unsubscribeMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    expect(clearNewsletterSubscribedCookieMock).toHaveBeenCalledTimes(1);
  });

  it('returns { ok: false }, logs, and does not clear the cookie when the db write throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    unsubscribeMock.mockRejectedValue(new Error('boom'));
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({ ok: false });
    expect(errorSpy).toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('still returns { ok: true } (logging, not failing) when clearing the cookie throws after a real successful unsubscribe', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    unsubscribeMock.mockResolvedValue(undefined);
    clearNewsletterSubscribedCookieMock.mockRejectedValue(
      new Error('cookie store down'),
    );
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({ ok: true });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.subscribed_cookie_clear_failed'),
    );
    errorSpy.mockRestore();
  });
});

describe('resendConfirmationAction', () => {
  beforeEach(() => {
    authMock.mockReset();
    resendConfirmationMock.mockReset();
    sendEmailMock.mockReset();
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT_ID);
  });

  it('returns { ok: false } without resending when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: false });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without resending when the session has no email', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: false });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without resending when no tenant resolves', async () => {
    authMock.mockResolvedValue(session);
    getRequestTenantIdMock.mockResolvedValue(undefined);
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: false });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('resends the confirmation email to the session email and returns { ok: true }', async () => {
    authMock.mockResolvedValue(session);
    resendConfirmationMock.mockResolvedValue({
      outcome: 'pending',
      confirmationToken: 'token-abc',
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: true });
    expect(resendConfirmationMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'val@icloud.com',
        html: expect.stringContaining(
          'https://example.com/api/newsletter/confirm?token=token-abc',
        ),
      }),
    );
  });

  it('returns { ok: false } without sending when the db reports not-pending', async () => {
    authMock.mockResolvedValue(session);
    resendConfirmationMock.mockResolvedValue({ outcome: 'not-pending' });
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: false });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } and logs when sending the confirmation email throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    resendConfirmationMock.mockResolvedValue({
      outcome: 'pending',
      confirmationToken: 'token-abc',
    });
    sendEmailMock.mockRejectedValue(new Error('resend down'));
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: false });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
