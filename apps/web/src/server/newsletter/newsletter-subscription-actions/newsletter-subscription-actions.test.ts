import {
  PRESET_ID,
  resolveTenantEmailBrand,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { TENANT_STATUS } from '@blog/db';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import type { MockInstance } from 'vitest';

const {
  authMock,
  unsubscribeMock,
  resendConfirmationMock,
  sendEmailMock,
  resolveTenantEmailIdentityMock,
  clearNewsletterSubscribedCookieMock,

  resolveWritableTenantMock,
  resolveRequestTenantMock,
  getEmailConfigMock,
  getEmailTemplateMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  unsubscribeMock: vi.fn(),
  resendConfirmationMock: vi.fn(),
  sendEmailMock: vi.fn(),
  resolveTenantEmailIdentityMock: vi.fn(),
  clearNewsletterSubscribedCookieMock: vi.fn(),
  resolveWritableTenantMock: vi.fn(),
  resolveRequestTenantMock: vi.fn(),
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
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE: {
    EN: {
      NEWSLETTER_CONFIRMATION: {
        subject: 'Confirm your newsletter subscription',
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
    clearNewsletterSubscribedCookie: clearNewsletterSubscribedCookieMock,
  }),
);

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: resolveRequestTenantMock,
}));

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
}));

const TENANT_ID = 'tenant-1';

vi.mock('@web/utils/env/env', () => ({
  env: { NEWSLETTER_FROM_ADDRESS: undefined },
}));

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

const session = {
  user: { id: 'user-1', email: 'val@icloud.com' },
};

describe('unsubscribeAction', () => {
  let unsubscribeAction: typeof import('./newsletter-subscription-actions').unsubscribeAction;
  let errorSpy: MockInstance<typeof console.error>;

  beforeEach(async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockReset();
    authMock.mockResolvedValue(session);
    unsubscribeMock.mockReset();
    unsubscribeMock.mockResolvedValue(undefined);
    clearNewsletterSubscribedCookieMock.mockReset();
    clearNewsletterSubscribedCookieMock.mockResolvedValue(undefined);
    resolveRequestTenantMock.mockReset();
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
    });
    ({ unsubscribeAction } = await import('./newsletter-subscription-actions'));
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('returns { ok: false } without unsubscribing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(unsubscribeAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(unsubscribeMock).not.toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without unsubscribing when no tenant resolves', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    await expect(unsubscribeAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(unsubscribeMock).not.toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'unsubscribes the session user when the tenant is %s',
    async (status) => {
      resolveRequestTenantMock.mockResolvedValue({ id: TENANT_ID, status });

      await expect(unsubscribeAction()).resolves.toEqual({ ok: true });
      expect(unsubscribeMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    },
  );

  it('unsubscribes the session user, clears the cookie, and returns { ok: true }', async () => {
    await expect(unsubscribeAction()).resolves.toEqual({ ok: true });
    expect(unsubscribeMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    expect(clearNewsletterSubscribedCookieMock).toHaveBeenCalledTimes(1);
  });

  it('returns { ok: false }, logs and keeps the cookie when the db write throws', async () => {
    unsubscribeMock.mockRejectedValue(new Error('boom'));

    await expect(unsubscribeAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(errorSpy).toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('still returns { ok: true }, logging, when clearing the cookie throws', async () => {
    clearNewsletterSubscribedCookieMock.mockRejectedValue(
      new Error('cookie store down'),
    );

    await expect(unsubscribeAction()).resolves.toEqual({ ok: true });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.subscribed_cookie_clear_failed'),
    );
  });
});

describe('resendConfirmationAction', () => {
  let resendConfirmationAction: typeof import('./newsletter-subscription-actions').resendConfirmationAction;

  beforeEach(async () => {
    authMock.mockReset();
    authMock.mockResolvedValue(session);
    resendConfirmationMock.mockReset();
    resendConfirmationMock.mockResolvedValue({
      outcome: 'pending',
      confirmationToken: 'token-abc',
      unsubscribeToken: 'unsub-token-abc',
    });
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
    resolveTenantEmailIdentityMock.mockReset();
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: 250,
      }),
      brandName: 'Acme Blog',
    });
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
    ({ resendConfirmationAction } =
      await import('./newsletter-subscription-actions'));
  });

  it('returns { ok: false } without resending when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without resending when the session has no email', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without resending when no tenant resolves', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without resending when the tenant is not ACTIVE, flagged unavailable', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.INACTIVE,
    });

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: true,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('resends the confirmation email to the session email and returns { ok: true }', async () => {
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

  it("renders the subscribing tenant's own brand in the resent confirmation email", async () => {
    const tenantBrand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 40,
    });
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: tenantBrand,
      brandName: 'Zeta Times',
    });

    await resendConfirmationAction();

    expect(resolveTenantEmailIdentityMock).toHaveBeenCalledWith(TENANT_ID);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(tenantBrand.logo1),
      }),
    );
  });

  it('returns { ok: false } without sending when the db reports not-pending', async () => {
    resendConfirmationMock.mockResolvedValue({ outcome: 'not-pending' });

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } and logs when sending the confirmation email throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sendEmailMock.mockRejectedValue(new Error('resend down'));

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('sends with a validated reply-to while preserving the List-Unsubscribe headers', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'support@example.com',
      footerPostalAddress: undefined,
    });

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
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'not-an-address',
      footerPostalAddress: undefined,
    });

    await expect(resendConfirmationAction()).resolves.toEqual({ ok: true });
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

    it('still sends the confirmation email when the email settings lookup rejects', async () => {
      getEmailConfigMock.mockRejectedValue(new Error('db down'));

      await expect(resendConfirmationAction()).resolves.toEqual({ ok: true });
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'val@icloud.com' }),
      );
    });

    it('falls back to default subject and body when the authored-copy lookup rejects', async () => {
      getEmailTemplateMock.mockRejectedValue(new Error('db down'));

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
    });
  });
});
