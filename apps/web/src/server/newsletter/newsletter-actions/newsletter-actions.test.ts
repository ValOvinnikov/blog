import {
  PRESET_ID,
  resolveTenantEmailBrand,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';

const {
  createPendingSubscriberMock,
  sendEmailMock,
  resolveTenantEmailIdentityMock,
  markNewsletterSubscribedMock,

  resolveWritableTenantMock,
  getEmailConfigMock,
  getEmailTemplateMock,
} = vi.hoisted(() => ({
  createPendingSubscriberMock: vi.fn(),
  sendEmailMock: vi.fn(),
  resolveTenantEmailIdentityMock: vi.fn(),
  markNewsletterSubscribedMock: vi.fn(),
  resolveWritableTenantMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    subscribers: { createPendingSubscriber: createPendingSubscriberMock },
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

vi.mock(
  '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie',
  () => ({
    markNewsletterSubscribed: markNewsletterSubscribedMock,
  }),
);

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
}));

const TENANT_ID = 'tenant-1';

vi.mock('@web/utils/env/env', () => ({
  env: { NEWSLETTER_FROM_ADDRESS: undefined },
}));

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

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
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
    resolveWritableTenantMock.mockReset();
    resolveWritableTenantMock.mockResolvedValue({
      ok: true,
      tenantId: TENANT_ID,
    });
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

  it('re-sends the confirmation email and returns "success" for a pending subscriber', async () => {
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

  it('returns "already-subscribed" without sending an email for an active subscriber', async () => {
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
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'server-error' });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('returns "unavailable" without touching the db when the tenant is not ACTIVE', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.INACTIVE,
    });
    const { subscribeToNewsletterAction } =
      await import('./newsletter-actions');

    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'unavailable' });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('returns "server-error" and logs when createPendingSubscriber fails', async () => {
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

  it('still returns "success", logging, when marking the cookie throws after signup', async () => {
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

  it("renders the subscribing tenant's own brand and name in the confirmation email", async () => {
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

  it('falls back to default subject and body when the authored-copy lookup rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getEmailTemplateMock.mockRejectedValue(new Error('db down'));
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
      expect.objectContaining({
        to: 'reader@example.com',
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

  it('still returns "already-subscribed", logging, when marking the cookie throws', async () => {
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
