import {
  ACTION_OUTCOME,
  CAPABILITY,
  ERROR_CODE,
  PRESET_ID,
  resolveTenantEmailBrand,
  SUBSCRIBER_OUTCOME,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import {
  NEWSLETTER_OUTCOME,
  SUBSCRIBE_FAILED_EVENT,
} from '@web/constants/newsletter';
import { setConfirmationEmailDefaults } from '@web/testing/server/newsletter/confirmation-email-defaults';
import { confirmationEmailEdges } from '@web/testing/server/newsletter/confirmation-email-edges';
import { firstSentEmail } from '@web/testing/server/newsletter/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSubscriber } from '@web/testing/shared/subscriber/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { subscribeToNewsletterAction } from './newsletter-actions';

const {
  createPendingSubscriberMock,
  markNewsletterSubscribedMock,
  resolveWritableTenantMock,
  isSubscribeAttemptRefusedMock,
  getTenantPlanMock,
  getEffectiveSettingsFeaturesMock,
} = vi.hoisted(() => ({
  createPendingSubscriberMock: vi.fn(),
  markNewsletterSubscribedMock: vi.fn(),
  resolveWritableTenantMock: vi.fn(),
  isSubscribeAttemptRefusedMock: vi.fn(),
  getTenantPlanMock: vi.fn(),
  getEffectiveSettingsFeaturesMock: vi.fn(),
}));

const { sendEmail: sendEmailMock } = confirmationEmailEdges;

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: (
    await import('@web/testing/server/newsletter/confirmation-email-edges')
  ).confirmationEmailQueries({
    createPendingSubscriber: createPendingSubscriberMock,
  }),
}));

vi.mock(import('@blog/email'), async (importOriginal) => ({
  ...(await importOriginal()),
  sendEmail: (
    await import('@web/testing/server/newsletter/confirmation-email-edges')
  ).confirmationEmailEdges.sendEmail,
}));

vi.mock('@web/utils/resolve-tenant-email-identity', async () => ({
  resolveTenantEmailIdentity: (
    await import('@web/testing/server/newsletter/confirmation-email-edges')
  ).confirmationEmailEdges.resolveTenantEmailIdentity,
}));

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/utils/env/env', async () => ({
  env: (await import('@web/testing/server/newsletter/confirmation-email-edges'))
    .confirmationEmailEnv,
}));

vi.mock(
  '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie',
  () => ({ markNewsletterSubscribed: markNewsletterSubscribedMock }),
);

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

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
}));

const COOKIE_SET_FAILED_EVENT = 'newsletter.subscribed_cookie_set_failed';
const MOCK_SUBSCRIBER = mockSubscriber();
const MOCK_BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ max: 359 }),
});
const SUCCESS = { outcome: ACTION_OUTCOME.SUCCESS };
const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR };
const UNAVAILABLE = { outcome: ACTION_OUTCOME.UNAVAILABLE };
const ALREADY_SUBSCRIBED = { outcome: NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED };

const resolveSubscriber = (outcome: string) =>
  createPendingSubscriberMock.mockResolvedValue(
    okResult({ outcome, subscriber: MOCK_SUBSCRIBER }),
  );

describe(subscribeToNewsletterAction, () => {
  beforeEach(() => {
    resolveSubscriber(SUBSCRIBER_OUTCOME.CREATED);
    setConfirmationEmailDefaults({ brand: MOCK_BRAND });
    markNewsletterSubscribedMock.mockResolvedValue(undefined);
    getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.GROWTH));
    getEffectiveSettingsFeaturesMock.mockResolvedValue(
      okResult({ [CAPABILITY.NEWSLETTER]: true }),
    );
    resolveWritableTenantMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
    isSubscribeAttemptRefusedMock.mockResolvedValue(false);
  });

  it('answers invalid for a malformed email without storing anything', async () => {
    const result = await subscribeToNewsletterAction(faker.lorem.word());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { email: { reason: FIELD_ERROR.INVALID } },
    });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it.each([
    ['brand-new', SUBSCRIBER_OUTCOME.CREATED],
    ['pending', SUBSCRIBER_OUTCOME.ALREADY_PENDING],
  ])(
    'sends a %s subscriber the confirmation and marks them subscribed',
    async (_case, outcome) => {
      resolveSubscriber(outcome);

      const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

      expect(result).toEqual(SUCCESS);
      expect(createPendingSubscriberMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_SUBSCRIBER.email,
      );
      expect(firstSentEmail(sendEmailMock).to).toBe(MOCK_SUBSCRIBER.email);
      expect(markNewsletterSubscribedMock).toHaveBeenCalledOnce();
    },
  );

  it('answers already-subscribed for an active subscriber without emailing', async () => {
    resolveSubscriber(SUBSCRIBER_OUTCOME.ALREADY_ACTIVE);

    const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

    expect(result).toEqual(ALREADY_SUBSCRIBED);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).toHaveBeenCalledOnce();
  });

  it("gates on the resolved tenant's capability without a request context", async () => {
    await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

    expect(getTenantPlanMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getEffectiveSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it.each([
    [
      'rate-limited for a refused attempt',
      { outcome: ACTION_OUTCOME.RATE_LIMITED },
      () => isSubscribeAttemptRefusedMock.mockResolvedValue(true),
    ],
    [
      'server-error when no tenant resolves',
      SERVER_ERROR,
      () =>
        resolveWritableTenantMock.mockResolvedValue(
          errorResult(TENANT_WRITE_REFUSAL.UNRESOLVED),
        ),
    ],
    [
      'unavailable for an inactive tenant',
      UNAVAILABLE,
      () =>
        resolveWritableTenantMock.mockResolvedValue(
          errorResult(TENANT_WRITE_REFUSAL.INACTIVE),
        ),
    ],
    [
      'unavailable with the newsletter switched off',
      UNAVAILABLE,
      () =>
        getEffectiveSettingsFeaturesMock.mockResolvedValue(
          okResult({ [CAPABILITY.NEWSLETTER]: false }),
        ),
    ],
    [
      'unavailable on a plan without the newsletter',
      UNAVAILABLE,
      () => getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.FREE)),
    ],
  ])('answers %s without storing', async (_case, expected, arrange) => {
    arrange();

    const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

    expect(result).toEqual(expected);
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('answers server-error and logs the code when storing fails', async () => {
    createPendingSubscriberMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

    expect(result).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SUBSCRIBE_FAILED_EVENT,
      { error: ERROR_CODE.DB_NOT_FOUND },
    );
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it.each([
    ['storing the subscriber', createPendingSubscriberMock],
    ['sending the confirmation', sendEmailMock],
  ])('answers server-error and logs when %s throws', async (_case, failing) => {
    failing.mockRejectedValue(MOCK_ERROR);

    const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

    expect(result).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SUBSCRIBE_FAILED_EVENT,
      { error: MOCK_ERROR },
    );
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it.each([
    ['signed-up', SUBSCRIBER_OUTCOME.CREATED, SUCCESS],
    [
      'already-subscribed',
      SUBSCRIBER_OUTCOME.ALREADY_ACTIVE,
      ALREADY_SUBSCRIBED,
    ],
  ])(
    'keeps the %s answer and logs when marking the cookie throws',
    async (_case, outcome, expected) => {
      resolveSubscriber(outcome);
      markNewsletterSubscribedMock.mockRejectedValue(MOCK_ERROR);

      const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

      expect(result).toEqual(expected);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        COOKIE_SET_FAILED_EVENT,
        { error: MOCK_ERROR },
      );
    },
  );
});
