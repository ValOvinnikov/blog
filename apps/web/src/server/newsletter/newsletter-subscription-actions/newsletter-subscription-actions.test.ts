import {
  PRESET_ID,
  resolveTenantEmailBrand,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { TENANT_STATUS } from '@blog/db';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';

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
  beforeEach(() => {
    authMock.mockReset();
    unsubscribeMock.mockReset();
    clearNewsletterSubscribedCookieMock.mockReset();
    resolveRequestTenantMock.mockReset();
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
    });
  });

  it('returns { ok: false } without unsubscribing when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(unsubscribeMock).not.toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without unsubscribing when no tenant resolves', async () => {
    authMock.mockResolvedValue(session);
    resolveRequestTenantMock.mockResolvedValue(undefined);
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

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
      authMock.mockResolvedValue(session);
      resolveRequestTenantMock.mockResolvedValue({ id: TENANT_ID, status });
      unsubscribeMock.mockResolvedValue(undefined);
      clearNewsletterSubscribedCookieMock.mockResolvedValue(undefined);
      const { unsubscribeAction } =
        await import('./newsletter-subscription-actions');

      await expect(unsubscribeAction()).resolves.toEqual({ ok: true });
      expect(unsubscribeMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    },
  );

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

  it('returns { ok: false }, logs and keeps the cookie when the db write throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    unsubscribeMock.mockRejectedValue(new Error('boom'));
    const { unsubscribeAction } =
      await import('./newsletter-subscription-actions');

    await expect(unsubscribeAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(errorSpy).toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('still returns { ok: true }, logging, when clearing the cookie throws', async () => {
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

  it('returns { ok: false } without resending when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without resending when the session has no email', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without resending when no tenant resolves', async () => {
    authMock.mockResolvedValue(session);
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without resending when the tenant is not ACTIVE, flagged unavailable', async () => {
    authMock.mockResolvedValue(session);
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.INACTIVE,
    });
    const { resendConfirmationAction } =
      await import('./newsletter-subscription-actions');

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: true,
    });
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

  it("renders the subscribing tenant's own brand in the resent confirmation email", async () => {
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

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
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

    await expect(resendConfirmationAction()).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
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

  it('falls back to default subject and body when the authored-copy lookup rejects', async () => {
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
