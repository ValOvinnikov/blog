import {
  PRESET_ID,
  resolveTenantEmailBrand,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { getLocale } from 'next-intl/server';
import type { MockInstance } from 'vitest';

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
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE: {
    EN: {
      NEWSLETTER_CONFIRMATION: {
        subject: 'Confirm your newsletter subscription',
        body: [{ _type: 'block', _key: 'newsletter-confirmation-default-1' }],
      },
    },
    FR: {
      NEWSLETTER_CONFIRMATION: {
        subject: 'Confirmez votre abonnement',
        body: [{ _type: 'block', _key: 'newsletter-confirmation-default-1' }],
      },
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

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({
    isCapabilityEnabled: vi.fn(),
  }),
);

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
}));

const TENANT_ID = 'tenant-1';

vi.mock('@web/utils/env/env', () => ({
  env: { NEWSLETTER_FROM_ADDRESS: undefined },
}));

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);
const isCapabilityEnabledMock = vi.mocked(isCapabilityEnabled);

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
  let subscribeToNewsletterAction: typeof import('./newsletter-actions').subscribeToNewsletterAction;

  beforeEach(async () => {
    createPendingSubscriberMock.mockReset();
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'created', subscriber },
    });
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
    resolveTenantEmailIdentityMock.mockReset();
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: DEFAULT_BRAND,
      brandName: 'Acme Blog',
    });
    markNewsletterSubscribedMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
    isCapabilityEnabledMock.mockReset();
    isCapabilityEnabledMock.mockResolvedValue(true);
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
    ({ subscribeToNewsletterAction } = await import('./newsletter-actions'));
  });

  it('returns "invalid" without touching the db for a malformed email', async () => {
    await expect(subscribeToNewsletterAction('not-an-email')).resolves.toEqual({
      outcome: 'invalid',
    });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('sends a confirmation email and returns "success" for a brand-new subscriber', async () => {
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

  it('sends confirm and unsubscribe links carrying the language the reader subscribed in', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce('FR');

    await subscribeToNewsletterAction('reader@example.com');

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(
          'https://example.com/api/newsletter/confirm?token=token-abc&amp;lang=FR',
        ),
        headers: expect.objectContaining({
          'List-Unsubscribe':
            '<https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc&lang=FR>',
        }),
      }),
    );
  });

  it('re-sends the confirmation email and returns "success" for a pending subscriber', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'already-pending', subscriber },
    });
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
    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'unavailable' });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it("renders the subscribing tenant's own brand and name in the confirmation email", async () => {
    const tenantBrand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 40,
    });
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: tenantBrand,
      brandName: 'Zeta Times',
    });
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

  it('sends with a validated reply-to while preserving the List-Unsubscribe headers', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'support@example.com',
      footerPostalAddress: undefined,
    });
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
    await expect(
      subscribeToNewsletterAction('reader@example.com'),
    ).resolves.toEqual({ outcome: 'success' });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: undefined }),
    );
  });

  describe('when console warnings are expected', () => {
    let warnSpy: MockInstance<typeof console.warn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('returns "unavailable" without writing a subscriber or sending an email when the Newsletter capability is off', async () => {
      isCapabilityEnabledMock.mockResolvedValue(false);
      await expect(
        subscribeToNewsletterAction('reader@example.com'),
      ).resolves.toEqual({ outcome: 'unavailable' });
      expect(isCapabilityEnabledMock).toHaveBeenCalledWith('NEWSLETTER');
      expect(createPendingSubscriberMock).not.toHaveBeenCalled();
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    });

    it('still sends the confirmation email when the email settings lookup rejects', async () => {
      getEmailConfigMock.mockRejectedValue(new Error('db down'));
      await expect(
        subscribeToNewsletterAction('reader@example.com'),
      ).resolves.toEqual({ outcome: 'success' });
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'reader@example.com' }),
      );
    });

    it('falls back to default subject and body when the authored-copy lookup rejects', async () => {
      getEmailTemplateMock.mockRejectedValue(new Error('db down'));
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
    });
  });

  describe('when console errors are expected', () => {
    let errorSpy: MockInstance<typeof console.error>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('returns "server-error" and logs when createPendingSubscriber fails', async () => {
      createPendingSubscriberMock.mockResolvedValue({
        ok: false,
        error: 'DB_NOT_FOUND',
      });
      await expect(
        subscribeToNewsletterAction('reader@example.com'),
      ).resolves.toEqual({ outcome: 'server-error' });
      expect(errorSpy).toHaveBeenCalled();
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    });

    it('returns "server-error" and logs when the db write throws', async () => {
      createPendingSubscriberMock.mockRejectedValue(new Error('db down'));
      await expect(
        subscribeToNewsletterAction('reader@example.com'),
      ).resolves.toEqual({ outcome: 'server-error' });
      expect(errorSpy).toHaveBeenCalled();
      expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    });

    it('returns "server-error" and logs when sending the confirmation email throws', async () => {
      sendEmailMock.mockRejectedValue(new Error('resend down'));
      await expect(
        subscribeToNewsletterAction('reader@example.com'),
      ).resolves.toEqual({ outcome: 'server-error' });
      expect(errorSpy).toHaveBeenCalled();
      expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    });

    it('still returns "success", logging, when marking the cookie throws after signup', async () => {
      markNewsletterSubscribedMock.mockRejectedValue(
        new Error('cookie store down'),
      );
      await expect(
        subscribeToNewsletterAction('reader@example.com'),
      ).resolves.toEqual({ outcome: 'success' });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('newsletter.subscribed_cookie_set_failed'),
      );
    });

    it('still returns "already-subscribed", logging, when marking the cookie throws', async () => {
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
      await expect(
        subscribeToNewsletterAction('reader@example.com'),
      ).resolves.toEqual({ outcome: 'already-subscribed' });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('newsletter.subscribed_cookie_set_failed'),
      );
    });
  });
});
