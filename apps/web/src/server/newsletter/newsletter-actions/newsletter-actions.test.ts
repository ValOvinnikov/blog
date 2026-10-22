import {
  ACTION_OUTCOME,
  CAPABILITY,
  SUBSCRIBER_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  ERROR_CODE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  resolveTenantEmailBrand,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
  TENANT_PLAN,
} from '@blog/db/constants';
import { escapeHtml, LIST_UNSUBSCRIBE_ONE_CLICK } from '@blog/email';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import {
  SUBSCRIBE_FAILED_EVENT,
  NEWSLETTER_OUTCOME,
} from '@web/constants/newsletter';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { makeSubscriber } from '@web/testing/shared/subscriber/fixtures';
import { logger } from '@web/utils/logger/logger';
import { getLocale } from 'next-intl/server';

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
  commitConfirmationTokenMock,
  mintNewsletterUnsubscribeTokenMock,
  isSubscribeAttemptRefusedMock,
  getTenantPlanMock,
  getEffectiveSettingsFeaturesMock,
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
  commitConfirmationTokenMock: vi.fn(),
  mintNewsletterUnsubscribeTokenMock: vi.fn(),
  isSubscribeAttemptRefusedMock: vi.fn(),
  getTenantPlanMock: vi.fn(),
  getEffectiveSettingsFeaturesMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    subscribers: {
      createPendingSubscriber: createPendingSubscriberMock,
      claimConfirmationSend: claimConfirmationSendMock,
      releaseConfirmationSend: releaseConfirmationSendMock,
      commitConfirmationToken: commitConfirmationTokenMock,
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
    markNewsletterSubscribed: markNewsletterSubscribedMock,
  }),
);

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock(
  '@web/server/settings-features/get-tenant-plan/get-tenant-plan',
  () => ({ getTenantPlan: getTenantPlanMock }),
);

vi.mock(
  '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features',
  () => ({ getEffectiveSettingsFeatures: getEffectiveSettingsFeaturesMock }),
);

vi.mock('@web/server/newsletter/subscribe-guard/subscribe-guard', () => ({
  isSubscribeAttemptRefused: isSubscribeAttemptRefusedMock,
}));

vi.mock(
  '@web/server/newsletter/newsletter-unsubscribe-token/newsletter-unsubscribe-token',
  () => ({
    mintNewsletterUnsubscribeToken: mintNewsletterUnsubscribeTokenMock,
  }),
);

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

const DEFAULT_CONFIRMATION_SUBJECT =
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[LOCALE_ISO_CODES.EN][
    EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION
  ].subject;

const COOKIE_SET_FAILED_EVENT = 'newsletter.subscribed_cookie_set_failed';

const subscriber = makeSubscriber({ id: faker.string.uuid(), email: EMAIL });

const CLAIMED_AT = faker.date.recent();
const CLAIM = {
  claimedAt: CLAIMED_AT,
  confirmationToken: CONFIRMATION_TOKEN,
};

const DEFAULT_BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ max: 359 }),
});

describe('subscribeToNewsletterAction', () => {
  let subscribeToNewsletterAction: typeof import('./newsletter-actions').subscribeToNewsletterAction;

  beforeEach(async () => {
    createPendingSubscriberMock.mockReset();
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: { outcome: SUBSCRIBER_OUTCOME.CREATED, subscriber },
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
    getTenantPlanMock.mockReset();
    getTenantPlanMock.mockResolvedValue({ ok: true, data: TENANT_PLAN.GROWTH });
    getEffectiveSettingsFeaturesMock.mockReset();
    getEffectiveSettingsFeaturesMock.mockResolvedValue({
      ok: true,
      data: { [CAPABILITY.NEWSLETTER]: true },
    });
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
    claimConfirmationSendMock.mockResolvedValue(CLAIM);
    releaseConfirmationSendMock.mockResolvedValue(undefined);
    commitConfirmationTokenMock.mockResolvedValue(undefined);
    mintNewsletterUnsubscribeTokenMock.mockReturnValue(UNSUBSCRIBE_TOKEN);
    isSubscribeAttemptRefusedMock.mockResolvedValue(false);
    ({ subscribeToNewsletterAction } = await import('./newsletter-actions'));
  });

  it('returns INVALID without touching the db for a malformed email', async () => {
    const result = await subscribeToNewsletterAction(faker.lorem.word());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { email: { reason: FIELD_ERROR.INVALID } },
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
          'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
        },
      }),
    );
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('stores the new confirm token only once the email is sent', async () => {
    await subscribeToNewsletterAction(EMAIL);

    expect(commitConfirmationTokenMock).toHaveBeenCalledWith(
      subscriber.id,
      CONFIRMATION_TOKEN,
    );
    expect(sendEmailMock.mock.invocationCallOrder[0]).toBeLessThan(
      commitConfirmationTokenMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("signs the unsubscribe link for the subscriber's own row", async () => {
    await subscribeToNewsletterAction(EMAIL);

    expect(mintNewsletterUnsubscribeTokenMock).toHaveBeenCalledWith(
      subscriber.id,
    );
  });

  it("gates on the resolved tenant's capability without a request context", async () => {
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(getTenantPlanMock).toHaveBeenCalledWith(TENANT_ID);
    expect(getEffectiveSettingsFeaturesMock).toHaveBeenCalledWith(TENANT_ID);
  });

  it('sends confirm and unsubscribe links carrying the language the reader subscribed in', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce(LOCALE_ISO_CODES.FR);

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
      data: {
        outcome: SUBSCRIBER_OUTCOME.ALREADY_PENDING,
        subscriber,
      },
    });
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('answers SUCCESS to a second sign-up inside the cooldown without emailing again', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: {
        outcome: SUBSCRIBER_OUTCOME.ALREADY_PENDING,
        subscriber,
      },
    });
    claimConfirmationSendMock
      .mockResolvedValueOnce(CLAIM)
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
        outcome: SUBSCRIBER_OUTCOME.ALREADY_ACTIVE,
        subscriber,
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
      accentHue: faker.number.int({ max: 359 }),
    });
    const tenantName = faker.string.alpha(12);
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
        html: expect.stringContaining(escapeHtml(tenantName)),
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
          'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
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

  it('returns UNAVAILABLE without storing or emailing when the capability is off', async () => {
    getEffectiveSettingsFeaturesMock.mockResolvedValue({
      ok: true,
      data: { [CAPABILITY.NEWSLETTER]: false },
    });
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('returns UNAVAILABLE without storing when the plan does not entitle the newsletter', async () => {
    getTenantPlanMock.mockResolvedValue({ ok: true, data: TENANT_PLAN.FREE });
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
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
        subject: DEFAULT_CONFIRMATION_SUBJECT,
        headers: {
          'List-Unsubscribe': `<${SITE_URL}/api/newsletter/unsubscribe?token=${UNSUBSCRIBE_TOKEN}>`,
          'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
        },
      }),
    );
  });

  it('returns SERVER_ERROR and logs when createPendingSubscriber fails', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SUBSCRIBE_FAILED_EVENT,
      { error: ERROR_CODE.DB_NOT_FOUND },
    );
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR and logs when the db write throws', async () => {
    createPendingSubscriberMock.mockRejectedValue(
      new Error(faker.lorem.sentence()),
    );
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SUBSCRIBE_FAILED_EVENT,
      { error: expect.any(Error) },
    );
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR and logs when sending the confirmation email throws', async () => {
    sendEmailMock.mockRejectedValue(new Error(faker.lorem.sentence()));
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SUBSCRIBE_FAILED_EVENT,
      { error: expect.any(Error) },
    );
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

  it('keeps the previous confirm token when the confirmation email fails to send', async () => {
    sendEmailMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    await subscribeToNewsletterAction(EMAIL);

    expect(commitConfirmationTokenMock).not.toHaveBeenCalled();
  });

  it('gives back the cooldown claim when storing the confirm token fails', async () => {
    commitConfirmationTokenMock.mockRejectedValue(
      new Error(faker.lorem.sentence()),
    );

    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
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
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      COOKIE_SET_FAILED_EVENT,
      { error: expect.any(Error) },
    );
  });

  it('still returns ALREADY_SUBSCRIBED, logging, when marking the cookie throws', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: true,
      data: {
        outcome: SUBSCRIBER_OUTCOME.ALREADY_ACTIVE,
        subscriber,
      },
    });
    markNewsletterSubscribedMock.mockRejectedValue(
      new Error(faker.lorem.sentence()),
    );
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({
      outcome: NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED,
    });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      COOKIE_SET_FAILED_EVENT,
      { error: expect.any(Error) },
    );
  });
});
