import { PRESET_ID, resolveTenantEmailBrand } from '@blog/config';

const {
  createPendingSubscriberMock,
  sendEmailMock,
  resolveTenantEmailIdentityMock,
  markNewsletterSubscribedMock,
  getRequestTenantIdMock,
  getTenantBaseUrlMock,
  isTenantActiveMock,
  getEmailConfigMock,
  getEmailTemplateMock,
} = vi.hoisted(() => ({
  createPendingSubscriberMock: vi.fn(),
  sendEmailMock: vi.fn(),
  resolveTenantEmailIdentityMock: vi.fn(),
  markNewsletterSubscribedMock: vi.fn(),
  getRequestTenantIdMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
  isTenantActiveMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    subscribers: { createPendingSubscriber: createPendingSubscriberMock },
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
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
  markNewsletterSubscribed: markNewsletterSubscribedMock,
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
// under jsdom — mock it the same way `send-email.test.ts` does.
vi.mock('@web/utils/env/env', () => ({
  env: { NEWSLETTER_FROM_ADDRESS: undefined },
}));

const subscriber = {
  id: 'sub-1',
  email: 'reader@example.com',
  status: 'pending' as const,
  confirmationToken: 'token-abc',
  unsubscribeToken: 'unsub-token-abc',
  subscribedAt: new Date('2026-01-01'),
  confirmedAt: null,
};

const DEFAULT_BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: 250,
});

describe('subscribeToNewsletterAction', () => {
  beforeEach(() => {
    createPendingSubscriberMock.mockReset();
    sendEmailMock.mockReset();
    resolveTenantEmailIdentityMock.mockReset();
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: DEFAULT_BRAND,
      brandName: 'Acme Blog',
    });
    markNewsletterSubscribedMock.mockReset();
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

  it('returns "invalid" without touching the db for a malformed email', async () => {
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(subscribeToNewsletterAction('not-an-email')).resolves.toEqual({
      outcome: 'invalid',
    });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('sends a confirmation email and returns "success" for a brand-new subscriber', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'created', subscriber },
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'success' });

    expect(createPendingSubscriberMock).toHaveBeenCalledWith(
      TENANT_ID,
      'reader@example.com',
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'reader@example.com',
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
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('re-sends the confirmation email and returns "success" for an already-pending subscriber', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'already-pending', subscriber },
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'success' });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('returns "already-subscribed" without sending an email for an already-active subscriber', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: {
        outcome: 'already-active',
        subscriber: { ...subscriber, status: 'active' as const },
      },
    });
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'already-subscribed' });
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('returns "server-error" without touching the db when no tenant resolves', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'server-error' });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('returns "server-error" without touching the db when the tenant is not ACTIVE', async () => {
    isTenantActiveMock.mockResolvedValue(false);
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'server-error' });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('returns "server-error" and logs when createPendingSubscriber resolves a typed failure', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createPendingSubscriberMock.mockResolvedValue({
      ok: false,
      error: 'DB_NOT_FOUND',
    });
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'server-error' });
    expect(errorSpy).toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('returns "server-error" and logs when the db write throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createPendingSubscriberMock.mockRejectedValue(new Error('db down'));
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'server-error' });
    expect(errorSpy).toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('returns "server-error" and logs when sending the confirmation email throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'created', subscriber },
    });
    sendEmailMock.mockRejectedValue(new Error('resend down'));
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'server-error' });
    expect(errorSpy).toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('still returns "success" (logging, not failing) when marking the cookie throws after a real successful signup', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'created', subscriber },
    });
    sendEmailMock.mockResolvedValue(undefined);
    markNewsletterSubscribedMock.mockRejectedValue(
      new Error('cookie store down'),
    );
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'success' });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.subscribed_cookie_set_failed'),
    );
    errorSpy.mockRestore();
  });

  it("renders the subscribing tenant's own resolved brand and name in the confirmation email", async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'created', subscriber },
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
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await subscribeToNewsletterAction('reader@example.com');

    expect(resolveTenantEmailIdentityMock).toHaveBeenCalledWith(TENANT_ID);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(tenantBrand.logo1),
      }),
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Zeta Times'),
      }),
    );
  });

  it('still sends the confirmation email when the email settings lookup rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getEmailConfigMock.mockRejectedValue(new Error('db down'));
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'created', subscriber },
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'success' });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'reader@example.com' }),
    );
    warnSpy.mockRestore();
  });

  it('sends with a validated reply-to while preserving the List-Unsubscribe headers', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'support@example.com',
      footerPostalAddress: undefined,
    });
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'created', subscriber },
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await subscribeToNewsletterAction('reader@example.com');

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

  it('drops a malformed stored reply-to address rather than blocking the send', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'not-an-address',
      footerPostalAddress: undefined,
    });
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'created', subscriber },
    });
    sendEmailMock.mockResolvedValue(undefined);
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'success' });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: undefined }),
    );
  });

  it('still returns "already-subscribed" (logging, not failing) when marking the cookie throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: {
        outcome: 'already-active',
        subscriber: { ...subscriber, status: 'active' as const },
      },
    });
    markNewsletterSubscribedMock.mockRejectedValue(
      new Error('cookie store down'),
    );
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'already-subscribed' });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.subscribed_cookie_set_failed'),
    );
    errorSpy.mockRestore();
  });
});
