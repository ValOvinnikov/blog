import {
  ACTION_OUTCOME,
  CAPABILITY,
  EMAIL_TEMPLATE_TYPE,
  ERROR_CODE,
  PRESET_ID,
  resolveTenantEmailBrand,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { NEWSLETTER_OUTCOME } from '@web/constants/newsletter';
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
  claimConfirmationSendMock,
  releaseConfirmationSendMock,
  isSubscribeAttemptRefusedMock,
} = vi.hoisted(() => ({
  createPendingSubscriberMock: vi.fn(),
  sendEmailMock: vi.fn(),
  resolveTenantEmailIdentityMock: vi.fn(),
  markNewsletterSubscribedMock: vi.fn(),
  resolveWritableTenantMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
  claimConfirmationSendMock: vi.fn(),
  releaseConfirmationSendMock: vi.fn(),
  isSubscribeAttemptRefusedMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    subscribers: {
      createPendingSubscriber: createPendingSubscriberMock,
      claimConfirmationSend: claimConfirmationSendMock,
      releaseConfirmationSend: releaseConfirmationSendMock,
    },
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

vi.mock('@web/server/newsletter/subscribe-guard/subscribe-guard', () => ({
  isSubscribeAttemptRefused: isSubscribeAttemptRefusedMock,
}));

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
}));

const TENANT_ID = faker.string.uuid();
const EMAIL = faker.internet.email();
const REPLY_TO = faker.internet.email();
const SITE_URL = `https://${faker.internet.domainName()}`;
const CONFIRMATION_TOKEN = faker.string.alphanumeric(16);
const UNSUBSCRIBE_TOKEN = faker.string.alphanumeric(16);
const BRAND_NAME = faker.company.name();

vi.mock('@web/utils/env/env', () => ({
  env: { NEWSLETTER_FROM_ADDRESS: undefined },
}));

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);
const isCapabilityEnabledMock = vi.mocked(isCapabilityEnabled);

const subscriber = {
  id: faker.string.uuid(),
  email: EMAIL,
  status: 'pending' as const,
  confirmationToken: CONFIRMATION_TOKEN,
  unsubscribeToken: UNSUBSCRIBE_TOKEN,
  subscribedAt: new Date('2026-01-01'),
  confirmedAt: null,
  confirmationSentAt: null,
};

const CLAIMED_AT = new Date('2026-10-15T10:00:00.000Z');

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
      brandName: BRAND_NAME,
    });
    markNewsletterSubscribedMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue(SITE_URL);
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
      templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      subject: faker.lorem.sentence(),
      body: [],
      logoAssetUrl: undefined,
    });
    claimConfirmationSendMock.mockResolvedValue(CLAIMED_AT);
    releaseConfirmationSendMock.mockResolvedValue(undefined);
    isSubscribeAttemptRefusedMock.mockResolvedValue(false);
    ({ subscribeToNewsletterAction } = await import('./newsletter-actions'));
  });

  it('returns INVALID without touching the db for a malformed email', async () => {
    const result = await subscribeToNewsletterAction(faker.lorem.word());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      invalidFields: ['email'],
    });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('sends a confirmation email and returns SUCCESS for a brand-new subscriber', async () => {
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });

    expect(createPendingSubscriberMock).toHaveBeenCalledWith(TENANT_ID, EMAIL);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: EMAIL,
        html: expect.stringContaining(
          `${SITE_URL}/api/newsletter/confirm?token=${CONFIRMATION_TOKEN}`,
        ),
        headers: {
          'List-Unsubscribe': `<${SITE_URL}/api/newsletter/unsubscribe?token=${UNSUBSCRIBE_TOKEN}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    );
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('sends confirm and unsubscribe links carrying the language the reader subscribed in', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce('FR');

    await subscribeToNewsletterAction(EMAIL);

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(
          `${SITE_URL}/api/newsletter/confirm?token=${CONFIRMATION_TOKEN}&amp;lang=FR`,
        ),
        headers: expect.objectContaining({
          'List-Unsubscribe': `<${SITE_URL}/api/newsletter/unsubscribe?token=${UNSUBSCRIBE_TOKEN}&lang=FR>`,
        }),
      }),
    );
  });

  it('re-sends the confirmation email and returns SUCCESS for a pending subscriber', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'already-pending', subscriber },
    });
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('answers SUCCESS to a second sign-up inside the cooldown without emailing again', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: 'already-pending', subscriber },
    });
    claimConfirmationSendMock
      .mockResolvedValueOnce(CLAIMED_AT)
      .mockResolvedValueOnce(null);

    await subscribeToNewsletterAction(EMAIL);

    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it('returns RATE_LIMITED without storing or sending when the attempt is refused', async () => {
    isSubscribeAttemptRefusedMock.mockResolvedValue(true);

    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.RATE_LIMITED });
    expect(isSubscribeAttemptRefusedMock).toHaveBeenCalledWith(TENANT_ID);
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('returns ALREADY_SUBSCRIBED without sending an email for an active subscriber', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: {
        outcome: 'already-active',
        subscriber: { ...subscriber, status: 'active' as const },
      },
    });
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED });
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('returns SERVER_ERROR without touching the db when no tenant resolves', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('returns UNAVAILABLE without touching the db when the tenant is not ACTIVE', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.INACTIVE,
    });
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it("renders the subscribing tenant's own brand and name in the confirmation email", async () => {
    const tenantBrand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 40,
    });
    const tenantName = faker.company.name();
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: tenantBrand,
      brandName: tenantName,
    });
    await subscribeToNewsletterAction(EMAIL);

    expect(resolveTenantEmailIdentityMock).toHaveBeenCalledWith(TENANT_ID);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(tenantBrand.logo1),
      }),
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(tenantName),
      }),
    );
  });

  it('sends with a validated reply-to while preserving the List-Unsubscribe headers', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: REPLY_TO,
      footerPostalAddress: undefined,
    });
    await subscribeToNewsletterAction(EMAIL);

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: REPLY_TO,
        headers: {
          'List-Unsubscribe': `<${SITE_URL}/api/newsletter/unsubscribe?token=${UNSUBSCRIBE_TOKEN}>`,
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
      replyToAddress: faker.lorem.word(),
      footerPostalAddress: undefined,
    });
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
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

    it('returns UNAVAILABLE without storing or emailing when the capability is off', async () => {
      isCapabilityEnabledMock.mockResolvedValue(false);
      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
      expect(isCapabilityEnabledMock).toHaveBeenCalledWith(
        CAPABILITY.NEWSLETTER,
      );
      expect(createPendingSubscriberMock).not.toHaveBeenCalled();
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    });

    it('still sends the confirmation email when the email settings lookup rejects', async () => {
      getEmailConfigMock.mockRejectedValue(new Error(faker.lorem.sentence()));
      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: EMAIL }),
      );
    });

    it('falls back to default subject and body when the authored-copy lookup rejects', async () => {
      getEmailTemplateMock.mockRejectedValue(new Error(faker.lorem.sentence()));
      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: EMAIL,
          subject: 'Confirm your newsletter subscription',
          headers: {
            'List-Unsubscribe': `<${SITE_URL}/api/newsletter/unsubscribe?token=${UNSUBSCRIBE_TOKEN}>`,
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

    it('returns SERVER_ERROR and logs when createPendingSubscriber fails', async () => {
      createPendingSubscriberMock.mockResolvedValue({
        ok: false,
        error: ERROR_CODE.DB_NOT_FOUND,
      });
      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(errorSpy).toHaveBeenCalled();
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    });

    it('returns SERVER_ERROR and logs when the db write throws', async () => {
      createPendingSubscriberMock.mockRejectedValue(
        new Error(faker.lorem.sentence()),
      );
      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(errorSpy).toHaveBeenCalled();
      expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    });

    it('returns SERVER_ERROR and logs when sending the confirmation email throws', async () => {
      sendEmailMock.mockRejectedValue(new Error(faker.lorem.sentence()));
      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(errorSpy).toHaveBeenCalled();
      expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    });

    it('gives back the cooldown claim when the confirmation email fails to send', async () => {
      sendEmailMock.mockRejectedValue(new Error(faker.lorem.sentence()));

      await subscribeToNewsletterAction(EMAIL);

      expect(releaseConfirmationSendMock).toHaveBeenCalledWith(
        subscriber.id,
        CLAIMED_AT,
      );
    });

    it('still returns SUCCESS, logging, when marking the cookie throws after signup', async () => {
      markNewsletterSubscribedMock.mockRejectedValue(
        new Error(faker.lorem.sentence()),
      );
      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('newsletter.subscribed_cookie_set_failed'),
      );
    });

    it('still returns ALREADY_SUBSCRIBED, logging, when marking the cookie throws', async () => {
      createPendingSubscriberMock.mockResolvedValue({
        ok: true,
        data: {
          outcome: 'already-active',
          subscriber: { ...subscriber, status: 'active' as const },
        },
      });
      markNewsletterSubscribedMock.mockRejectedValue(
        new Error(faker.lorem.sentence()),
      );
      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({
        outcome: NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED,
      });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('newsletter.subscribed_cookie_set_failed'),
      );
    });
  });
});
