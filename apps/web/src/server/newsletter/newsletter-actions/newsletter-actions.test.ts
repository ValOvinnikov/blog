import {
  ACTION_OUTCOME,
  CAPABILITY,
  SUBSCRIBER_OUTCOME,
  ERROR_CODE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  resolveTenantEmailBrand,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { escapeHtml } from '@blog/email';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import {
  SUBSCRIBE_FAILED_EVENT,
  NEWSLETTER_OUTCOME,
} from '@web/constants/newsletter';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import {
  firstSentEmail,
  MOCK_CONFIRMATION_SUBJECT,
  MOCK_CONFIRMATION_TOKEN,
  MOCK_REPLY_TO,
  MOCK_UNSUBSCRIBE_HEADERS,
  MOCK_UNSUBSCRIBE_TOKEN,
  MOCK_UNSUBSCRIBE_URL,
  mockEmailConfig,
  mockEmailTemplate,
} from '@web/testing/server/newsletter/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSubscriber } from '@web/testing/shared/subscriber/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
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

const EMAIL = faker.internet.email();
const BRAND_NAME = faker.company.name();

vi.mock('@web/utils/env/env', () => ({
  env: { NEWSLETTER_FROM_ADDRESS: undefined },
}));

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

const COOKIE_SET_FAILED_EVENT = 'newsletter.subscribed_cookie_set_failed';
const CONFIRM_URL = `${MOCK_TENANT_BASE_URL}/api/newsletter/confirm?token=${MOCK_CONFIRMATION_TOKEN}`;
const subscriber = mockSubscriber({
  id: faker.string.uuid(),
  email: EMAIL,
  status: 'pending',
  confirmedAt: null,
  confirmationSentAt: null,
});
const activeSubscriber = { ...subscriber, status: 'active' as const };

const CLAIMED_AT = faker.date.recent();
const CLAIM = {
  claimedAt: CLAIMED_AT,
  confirmationToken: MOCK_CONFIRMATION_TOKEN,
};

const DEFAULT_BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ max: 359 }),
});

const sentEmail = () => firstSentEmail(sendEmailMock);

describe('subscribeToNewsletterAction', () => {
  let subscribeToNewsletterAction: typeof import('./newsletter-actions').subscribeToNewsletterAction;

  beforeEach(async () => {
    createPendingSubscriberMock.mockReset();
    createPendingSubscriberMock.mockResolvedValue(
      okResult({ outcome: SUBSCRIBER_OUTCOME.CREATED, subscriber }),
    );
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
    resolveTenantEmailIdentityMock.mockReset();
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: DEFAULT_BRAND,
      brandName: BRAND_NAME,
    });
    markNewsletterSubscribedMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue(MOCK_TENANT_BASE_URL);
    getTenantPlanMock.mockReset();
    getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.GROWTH));
    getEffectiveSettingsFeaturesMock.mockReset();
    getEffectiveSettingsFeaturesMock.mockResolvedValue(
      okResult({ [CAPABILITY.NEWSLETTER]: true }),
    );
    resolveWritableTenantMock.mockReset();
    resolveWritableTenantMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
    getEmailConfigMock.mockReset();
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockReset();
    getEmailTemplateMock.mockResolvedValue(mockEmailTemplate());
    claimConfirmationSendMock.mockResolvedValue(CLAIM);
    releaseConfirmationSendMock.mockResolvedValue(undefined);
    commitConfirmationTokenMock.mockResolvedValue(undefined);
    mintNewsletterUnsubscribeTokenMock.mockReturnValue(MOCK_UNSUBSCRIBE_TOKEN);
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
    expect(createPendingSubscriberMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL,
    );
    const { to, html, headers } = sentEmail();
    expect(to).toBe(EMAIL);
    expect(html).toContain(CONFIRM_URL);
    expect(headers).toEqual(MOCK_UNSUBSCRIBE_HEADERS);
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('stores the new confirm token only once the email is sent', async () => {
    await subscribeToNewsletterAction(EMAIL);

    expect(commitConfirmationTokenMock).toHaveBeenCalledWith(
      subscriber.id,
      MOCK_CONFIRMATION_TOKEN,
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

  it('checks the rate limit and capability against the resolved tenant', async () => {
    await subscribeToNewsletterAction(EMAIL);

    expect(isSubscribeAttemptRefusedMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getTenantPlanMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getEffectiveSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it("carries the reader's language on the confirm and unsubscribe links", async () => {
    vi.mocked(getLocale).mockResolvedValueOnce(LOCALE_ISO_CODES.FR);

    await subscribeToNewsletterAction(EMAIL);

    const { html, headers } = sentEmail();
    expect(html).toContain(`${CONFIRM_URL}&amp;lang=FR`);
    expect(headers).toEqual({
      ...MOCK_UNSUBSCRIBE_HEADERS,
      'List-Unsubscribe': `<${MOCK_UNSUBSCRIBE_URL}&lang=FR>`,
    });
  });

  it('re-sends the confirmation email and returns SUCCESS for a pending subscriber', async () => {
    createPendingSubscriberMock.mockResolvedValue(
      okResult({ outcome: SUBSCRIBER_OUTCOME.ALREADY_PENDING, subscriber }),
    );
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
  });

  it('answers SUCCESS to a second sign-up inside the cooldown without emailing again', async () => {
    createPendingSubscriberMock.mockResolvedValue(
      okResult({ outcome: SUBSCRIBER_OUTCOME.ALREADY_PENDING, subscriber }),
    );
    claimConfirmationSendMock
      .mockResolvedValueOnce(CLAIM)
      .mockResolvedValueOnce(null);

    await subscribeToNewsletterAction(EMAIL);

    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      ACTION_OUTCOME.RATE_LIMITED,
      'the attempt is refused',
      () => isSubscribeAttemptRefusedMock.mockResolvedValue(true),
    ],
    [
      ACTION_OUTCOME.SERVER_ERROR,
      'no tenant resolves',
      () =>
        resolveWritableTenantMock.mockResolvedValue(
          errorResult(TENANT_WRITE_REFUSAL.UNRESOLVED),
        ),
    ],
    [
      ACTION_OUTCOME.UNAVAILABLE,
      'the tenant is not ACTIVE',
      () =>
        resolveWritableTenantMock.mockResolvedValue(
          errorResult(TENANT_WRITE_REFUSAL.INACTIVE),
        ),
    ],
    [
      ACTION_OUTCOME.UNAVAILABLE,
      'the capability is off',
      () =>
        getEffectiveSettingsFeaturesMock.mockResolvedValue(
          okResult({ [CAPABILITY.NEWSLETTER]: false }),
        ),
    ],
    [
      ACTION_OUTCOME.UNAVAILABLE,
      'the plan does not entitle the newsletter',
      () => getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.FREE)),
    ],
  ])(
    'returns %s without storing or sending when %s',
    async (outcome, _, arrange) => {
      arrange();

      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({ outcome });
      expect(createPendingSubscriberMock).not.toHaveBeenCalled();
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
    },
  );

  it('returns ALREADY_SUBSCRIBED without sending an email for an active subscriber', async () => {
    createPendingSubscriberMock.mockResolvedValue(
      okResult({
        outcome: SUBSCRIBER_OUTCOME.ALREADY_ACTIVE,
        subscriber: activeSubscriber,
      }),
    );
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED });
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).toHaveBeenCalledTimes(1);
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

    expect(resolveTenantEmailIdentityMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    const { html } = sentEmail();
    expect(html).toContain(tenantBrand.logo1);
    expect(html).toContain(escapeHtml(tenantName));
  });

  it('sends with a validated reply-to while preserving the List-Unsubscribe headers', async () => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ replyToAddress: MOCK_REPLY_TO }),
    );
    await subscribeToNewsletterAction(EMAIL);

    const { replyTo, headers } = sentEmail();
    expect(replyTo).toBe(MOCK_REPLY_TO);
    expect(headers).toEqual(MOCK_UNSUBSCRIBE_HEADERS);
  });

  it('sends the default subject when the authored-copy lookup rejects', async () => {
    getEmailTemplateMock.mockRejectedValue(MOCK_ERROR);
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    const { to, subject, headers } = sentEmail();
    expect(to).toBe(EMAIL);
    expect(subject).toBe(MOCK_CONFIRMATION_SUBJECT);
    expect(headers).toEqual(MOCK_UNSUBSCRIBE_HEADERS);
  });

  it('returns SERVER_ERROR and logs when createPendingSubscriber fails', async () => {
    createPendingSubscriberMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SUBSCRIBE_FAILED_EVENT,
      { error: ERROR_CODE.DB_NOT_FOUND },
    );
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'the db write throws',
      () => createPendingSubscriberMock.mockRejectedValue(MOCK_ERROR),
    ],
    [
      'sending the confirmation email throws',
      () => sendEmailMock.mockRejectedValue(MOCK_ERROR),
    ],
  ])('returns SERVER_ERROR and logs when %s', async (_, arrange) => {
    arrange();
    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SUBSCRIBE_FAILED_EVENT,
      { error: MOCK_ERROR },
    );
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('gives back the cooldown claim and keeps the old token when the email fails', async () => {
    sendEmailMock.mockRejectedValue(MOCK_ERROR);

    await subscribeToNewsletterAction(EMAIL);

    expect(releaseConfirmationSendMock).toHaveBeenCalledWith(
      subscriber.id,
      CLAIMED_AT,
    );
    expect(commitConfirmationTokenMock).not.toHaveBeenCalled();
  });

  it('gives back the cooldown claim when storing the confirm token fails', async () => {
    commitConfirmationTokenMock.mockRejectedValue(MOCK_ERROR);

    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(releaseConfirmationSendMock).toHaveBeenCalledWith(
      subscriber.id,
      CLAIMED_AT,
    );
  });

  it.each([
    [ACTION_OUTCOME.SUCCESS, SUBSCRIBER_OUTCOME.CREATED, subscriber],
    [
      NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED,
      SUBSCRIBER_OUTCOME.ALREADY_ACTIVE,
      activeSubscriber,
    ],
  ])(
    'still returns %s, logging, when marking the cookie throws',
    async (outcome, subscriberOutcome, storedSubscriber) => {
      createPendingSubscriberMock.mockResolvedValue(
        okResult({ outcome: subscriberOutcome, subscriber: storedSubscriber }),
      );
      markNewsletterSubscribedMock.mockRejectedValue(MOCK_ERROR);

      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual({ outcome });
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        COOKIE_SET_FAILED_EVENT,
        { error: MOCK_ERROR },
      );
    },
  );
});
