import {
  ACTION_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  resolveTenantEmailBrand,
  SUBSCRIBER_OUTCOME,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
  TENANT_STATUS,
} from '@blog/db/constants';
import { LIST_UNSUBSCRIBE_ONE_CLICK } from '@blog/email';
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

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    subscribers: {
      unsubscribe: unsubscribeMock,
      resendConfirmation: resendConfirmationMock,
    },
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
  },
}));

vi.mock(import('@blog/email'), async (importOriginal) => ({
  ...(await importOriginal()),
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

type TActions = typeof import('./newsletter-subscription-actions');

const SESSION_EMAIL = 'val@icloud.com';
const REPLY_TO_ADDRESS = 'support@example.com';
const UNSUBSCRIBE_HEADER =
  '<https://example.com/api/newsletter/unsubscribe?token=unsub-token-abc>';
const DEFAULT_CONFIRMATION_SUBJECT =
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[LOCALE_ISO_CODES.EN][
    EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION
  ].subject;

const session = {
  user: { id: 'user-1', email: SESSION_EMAIL },
};

describe('unsubscribeAction', () => {
  let unsubscribeAction: TActions['unsubscribeAction'];
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

  it('returns SERVER_ERROR without unsubscribing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(unsubscribeAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(unsubscribeMock).not.toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR without unsubscribing when no tenant resolves', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    await expect(unsubscribeAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(unsubscribeMock).not.toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'unsubscribes the session user when the tenant is %s',
    async (status) => {
      resolveRequestTenantMock.mockResolvedValue({ id: TENANT_ID, status });

      await expect(unsubscribeAction()).resolves.toEqual({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      expect(unsubscribeMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    },
  );

  it('unsubscribes the session user, clears the cookie, and returns SUCCESS', async () => {
    await expect(unsubscribeAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(unsubscribeMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    expect(clearNewsletterSubscribedCookieMock).toHaveBeenCalledTimes(1);
  });

  it('returns SERVER_ERROR, logs and keeps the cookie when the db write throws', async () => {
    unsubscribeMock.mockRejectedValue(new Error('boom'));

    await expect(unsubscribeAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(errorSpy).toHaveBeenCalled();
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('still returns SUCCESS, logging, when clearing the cookie throws', async () => {
    clearNewsletterSubscribedCookieMock.mockRejectedValue(
      new Error('cookie store down'),
    );

    await expect(unsubscribeAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.subscribed_cookie_clear_failed'),
    );
  });
});

describe('resendConfirmationAction', () => {
  let resendConfirmationAction: TActions['resendConfirmationAction'];

  beforeEach(async () => {
    authMock.mockReset();
    authMock.mockResolvedValue(session);
    resendConfirmationMock.mockReset();
    resendConfirmationMock.mockResolvedValue({
      outcome: SUBSCRIBER_OUTCOME.PENDING,
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
      templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      subject: 'Confirm your subscription',
      body: [],
      logoAssetUrl: undefined,
    });
    ({ resendConfirmationAction } =
      await import('./newsletter-subscription-actions'));
  });

  it('returns SERVER_ERROR without resending when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR without resending when the session has no email', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });

    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR without resending when no tenant resolves', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });

    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns UNAVAILABLE without resending when the tenant is not ACTIVE', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.INACTIVE,
    });

    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.UNAVAILABLE,
    });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('resends the confirmation email to the session email and returns SUCCESS', async () => {
    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(resendConfirmationMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: SESSION_EMAIL,
        html: expect.stringContaining(
          'https://example.com/api/newsletter/confirm?token=token-abc',
        ),
        headers: {
          'List-Unsubscribe': UNSUBSCRIBE_HEADER,
          'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
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

  it('returns SERVER_ERROR without sending when the db reports not-pending', async () => {
    resendConfirmationMock.mockResolvedValue({
      outcome: SUBSCRIBER_OUTCOME.NOT_PENDING,
    });

    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR and logs when sending the confirmation email throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sendEmailMock.mockRejectedValue(new Error('resend down'));

    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('sends with a validated reply-to while preserving the List-Unsubscribe headers', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: REPLY_TO_ADDRESS,
      footerPostalAddress: undefined,
    });

    await resendConfirmationAction();

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: REPLY_TO_ADDRESS,
        headers: {
          'List-Unsubscribe': UNSUBSCRIBE_HEADER,
          'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
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

    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
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

      await expect(resendConfirmationAction()).resolves.toEqual({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: SESSION_EMAIL }),
      );
    });

    it('falls back to default subject and body when the authored-copy lookup rejects', async () => {
      getEmailTemplateMock.mockRejectedValue(new Error('db down'));

      await expect(resendConfirmationAction()).resolves.toEqual({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: SESSION_EMAIL,
          subject: DEFAULT_CONFIRMATION_SUBJECT,
          headers: {
            'List-Unsubscribe': UNSUBSCRIBE_HEADER,
            'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
          },
        }),
      );
    });
  });
});
