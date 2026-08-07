export {};

const { authMock, unsubscribeMock, resendConfirmationMock, sendEmailMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    unsubscribeMock: vi.fn(),
    resendConfirmationMock: vi.fn(),
    sendEmailMock: vi.fn(),
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
  });

  it('returns { ok: false } without unsubscribing when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({ ok: false });
    expect(unsubscribeMock).not.toHaveBeenCalled();
  });

  it('unsubscribes the session user and returns { ok: true }', async () => {
    authMock.mockResolvedValue(session);
    unsubscribeMock.mockResolvedValue(undefined);
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({ ok: true });
    expect(unsubscribeMock).toHaveBeenCalledWith('user-1');
  });

  it('returns { ok: false } and logs when the db write throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    unsubscribeMock.mockRejectedValue(new Error('boom'));
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({ ok: false });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('resendConfirmationAction', () => {
  beforeEach(() => {
    authMock.mockReset();
    resendConfirmationMock.mockReset();
    sendEmailMock.mockReset();
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
    expect(resendConfirmationMock).toHaveBeenCalledWith('user-1');
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
