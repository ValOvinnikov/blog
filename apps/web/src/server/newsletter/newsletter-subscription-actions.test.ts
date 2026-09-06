import { PRESET_ID, resolveTenantEmailBrand } from '@blog/config';

const {
  authMock,
  unsubscribeMock,
  resendConfirmationMock,
  sendEmailMock,
  resolveTenantEmailIdentityMock,
  clearNewsletterSubscribedCookieMock,
  getRequestTenantIdMock,
  getTenantBaseUrlMock,
  isTenantActiveMock,
  getEmailConfigMock,
  getEmailTemplateMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  unsubscribeMock: vi.fn(),
  resendConfirmationMock: vi.fn(),
  sendEmailMock: vi.fn(),
  resolveTenantEmailIdentityMock: vi.fn(),
  clearNewsletterSubscribedCookieMock: vi.fn(),
  getRequestTenantIdMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
  isTenantActiveMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    subscribers: {
      unsubscribe: unsubscribeMock,
      resendConfirmation: resendConfirmationMock,
    },
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
  },
  EMAIL_TEMPLATE_DEFAULT_COPY: {
    NEWSLETTER_CONFIRMATION: {
      subject: 'Confirm your newsletter subscription',
      body: [{ _type: 'block', _key: 'newsletter-confirmation-default-1' }],
    },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/email')>()),
  sendEmail: sendEmailMock,
}));

vi.mock('@web/utils/resolve-tenant-email-identity', () => ({
  resolveTenantEmailIdentity: resolveTenantEmailIdentityMock,
}));

vi.mock('@web/server/newsletter/newsletter-subscribed-cookie', () => ({
  clearNewsletterSubscribedCookie: clearNewsletterSubscribedCookieMock,
}));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
}));

vi.mock('@web/server/tenant/is-tenant-active', () => ({
  isTenantActive: isTenantActiveMock,
}));

const TENANT_ID = 'tenant-1';

// The real `@t3-oss/env-nextjs` module throws when a server var is read
// under jsdom — mock it the same way `newsletter-actions.test.ts` does.
vi.mock('@web/utils/env/env', () => ({
  env: { NEWSLETTER_FROM_ADDRESS: undefined },
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
    isTenantActiveMock.mockReset();
    isTenantActiveMock.mockResolvedValue(true);
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

  it('returns { ok: false } without unsubscribing when the tenant is not ACTIVE', async () => {
    authMock.mockResolvedValue(session);
    isTenantActiveMock.mockResolvedValue(false);
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
    resolveTenantEmailIdentityMock.mockReset();
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: 250,
      }),
      brandName: 'Acme Blog',
    });
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT_ID);
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
    isTenantActiveMock.mockReset();
    isTenantActiveMock.mockResolvedValue(true);
    getEmailConfigMock.mockReset();
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockReset();
    getEmailTemplateMock.mockResolvedValue({
      tenantId: TENANT_ID,
      templateType: 'NEWSLETTER_CONFIRMATION',
      subject: 'Confirm your subscription',
      body: [],
      logoAssetUrl: undefined,
    });
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

  it('returns { ok: false } without resending when the tenant is not ACTIVE', async () => {
    authMock.mockResolvedValue(session);
    isTenantActiveMock.mockResolvedValue(false);
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
      unsubscribeToken: 'unsub-token-abc',
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
        headers: {
          'List-Unsubscribe':
            '<https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    );
  });

  it("renders the subscribing tenant's own resolved brand in the resent confirmation email", async () => {
    authMock.mockResolvedValue(session);
    resendConfirmationMock.mockResolvedValue({
      outcome: 'pending',
      confirmationToken: 'token-abc',
      unsubscribeToken: 'unsub-token-abc',
    });
    const tenantBrand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 40,
    });
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: tenantBrand,
      brandName: 'Zeta Times',
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await resendConfirmationAction();

    expect(resolveTenantEmailIdentityMock).toHaveBeenCalledWith(TENANT_ID);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(tenantBrand.logo1),
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
      unsubscribeToken: 'unsub-token-abc',
    });
    sendEmailMock.mockRejectedValue(new Error('resend down'));
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: false });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('still sends the confirmation email when the email settings lookup rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    getEmailConfigMock.mockRejectedValue(new Error('db down'));
    resendConfirmationMock.mockResolvedValue({
      outcome: 'pending',
      confirmationToken: 'token-abc',
      unsubscribeToken: 'unsub-token-abc',
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: true });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'val@icloud.com' }),
    );
    warnSpy.mockRestore();
  });

  it('falls back to product-default subject and body and still sends when the authored-copy lookup rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    getEmailTemplateMock.mockRejectedValue(new Error('db down'));
    resendConfirmationMock.mockResolvedValue({
      outcome: 'pending',
      confirmationToken: 'token-abc',
      unsubscribeToken: 'unsub-token-abc',
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: true });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'val@icloud.com',
        subject: 'Confirm your newsletter subscription',
        headers: {
          'List-Unsubscribe':
            '<https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    );
    warnSpy.mockRestore();
  });

  it('sends with a validated reply-to while preserving the List-Unsubscribe headers', async () => {
    authMock.mockResolvedValue(session);
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'support@example.com',
      footerPostalAddress: undefined,
    });
    resendConfirmationMock.mockResolvedValue({
      outcome: 'pending',
      confirmationToken: 'token-abc',
      unsubscribeToken: 'unsub-token-abc',
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await resendConfirmationAction();

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'support@example.com',
        headers: {
          'List-Unsubscribe':
            '<https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    );
  });

  it('drops a malformed stored reply-to address rather than blocking the resend', async () => {
    authMock.mockResolvedValue(session);
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'not-an-address',
      footerPostalAddress: undefined,
    });
    resendConfirmationMock.mockResolvedValue({
      outcome: 'pending',
      confirmationToken: 'token-abc',
      unsubscribeToken: 'unsub-token-abc',
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: true });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: undefined }),
    );
  });
});
