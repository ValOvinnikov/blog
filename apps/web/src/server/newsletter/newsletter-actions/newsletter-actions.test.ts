import {
  ACTION_OUTCOME,
  CAPABILITY,
  ERROR_CODE,
  SUBSCRIBER_OUTCOME,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import {
  NEWSLETTER_OUTCOME,
  SUBSCRIBE_FAILED_EVENT,
} from '@web/constants/newsletter';
import { makeSubscriber } from '@web/testing/shared/subscriber/fixtures';
import { logger } from '@web/utils/logger/logger';

import { subscribeToNewsletterAction } from './newsletter-actions';

const {
  createPendingSubscriberMock,
  sendNewsletterConfirmationMock,
  markNewsletterSubscribedMock,
  resolveWritableTenantMock,
  isSubscribeAttemptRefusedMock,
  getTenantPlanMock,
  getEffectiveSettingsFeaturesMock,
} = vi.hoisted(() => ({
  createPendingSubscriberMock: vi.fn(),
  sendNewsletterConfirmationMock: vi.fn(),
  markNewsletterSubscribedMock: vi.fn(),
  resolveWritableTenantMock: vi.fn(),
  isSubscribeAttemptRefusedMock: vi.fn(),
  getTenantPlanMock: vi.fn(),
  getEffectiveSettingsFeaturesMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    subscribers: { createPendingSubscriber: createPendingSubscriberMock },
  },
}));

vi.mock(
  '@web/server/newsletter/newsletter-confirmation-send/newsletter-confirmation-send',
  () => ({ sendNewsletterConfirmation: sendNewsletterConfirmationMock }),
);

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

const TENANT_ID = faker.string.uuid();
const EMAIL = faker.internet.email();
const COOKIE_SET_FAILED_EVENT = 'newsletter.subscribed_cookie_set_failed';
const SUBSCRIBER = makeSubscriber({ email: EMAIL });
const SUCCESS = { outcome: ACTION_OUTCOME.SUCCESS };
const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR };
const UNAVAILABLE = { outcome: ACTION_OUTCOME.UNAVAILABLE };
const ALREADY_SUBSCRIBED = { outcome: NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED };

const resolveSubscriber = (outcome: string) =>
  createPendingSubscriberMock.mockResolvedValue({
    ok: true,
    data: { outcome, subscriber: SUBSCRIBER },
  });

describe(subscribeToNewsletterAction, () => {
  beforeEach(() => {
    resolveSubscriber(SUBSCRIBER_OUTCOME.CREATED);
    sendNewsletterConfirmationMock.mockResolvedValue(undefined);
    markNewsletterSubscribedMock.mockResolvedValue(undefined);
    getTenantPlanMock.mockResolvedValue({ ok: true, data: TENANT_PLAN.GROWTH });
    getEffectiveSettingsFeaturesMock.mockResolvedValue({
      ok: true,
      data: { [CAPABILITY.NEWSLETTER]: true },
    });
    resolveWritableTenantMock.mockResolvedValue({
      ok: true,
      tenantId: TENANT_ID,
    });
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
    ['new', SUBSCRIBER_OUTCOME.CREATED],
    ['pending', SUBSCRIBER_OUTCOME.ALREADY_PENDING],
  ])(
    'sends a %s subscriber the confirmation and marks them subscribed',
    async (_case, outcome) => {
      resolveSubscriber(outcome);

      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual(SUCCESS);
      expect(createPendingSubscriberMock).toHaveBeenCalledWith(
        TENANT_ID,
        EMAIL,
      );
      expect(sendNewsletterConfirmationMock).toHaveBeenCalledWith(
        TENANT_ID,
        SUBSCRIBER,
      );
      expect(markNewsletterSubscribedMock).toHaveBeenCalledOnce();
    },
  );

  it('answers already-subscribed for an active subscriber without emailing', async () => {
    resolveSubscriber(SUBSCRIBER_OUTCOME.ALREADY_ACTIVE);

    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual(ALREADY_SUBSCRIBED);
    expect(sendNewsletterConfirmationMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).toHaveBeenCalledOnce();
  });

  it("gates on the resolved tenant's capability without a request context", async () => {
    await subscribeToNewsletterAction(EMAIL);

    expect(getTenantPlanMock).toHaveBeenCalledWith(TENANT_ID);
    expect(getEffectiveSettingsFeaturesMock).toHaveBeenCalledWith(TENANT_ID);
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
        resolveWritableTenantMock.mockResolvedValue({
          ok: false,
          reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
        }),
    ],
    [
      'unavailable for an inactive tenant',
      UNAVAILABLE,
      () =>
        resolveWritableTenantMock.mockResolvedValue({
          ok: false,
          reason: TENANT_WRITE_REFUSAL.INACTIVE,
        }),
    ],
    [
      'unavailable with the newsletter switched off',
      UNAVAILABLE,
      () =>
        getEffectiveSettingsFeaturesMock.mockResolvedValue({
          ok: true,
          data: { [CAPABILITY.NEWSLETTER]: false },
        }),
    ],
    [
      'unavailable on a plan without the newsletter',
      UNAVAILABLE,
      () =>
        getTenantPlanMock.mockResolvedValue({
          ok: true,
          data: TENANT_PLAN.FREE,
        }),
    ],
  ])('answers %s without storing', async (_case, expected, arrange) => {
    arrange();

    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual(expected);
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(markNewsletterSubscribedMock).not.toHaveBeenCalled();
  });

  it('answers server-error and logs the code when storing fails', async () => {
    createPendingSubscriberMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SUBSCRIBE_FAILED_EVENT,
      { error: ERROR_CODE.DB_NOT_FOUND },
    );
    expect(sendNewsletterConfirmationMock).not.toHaveBeenCalled();
  });

  it.each([
    ['storing the subscriber', createPendingSubscriberMock],
    ['sending the confirmation', sendNewsletterConfirmationMock],
  ])('answers server-error and logs when %s throws', async (_case, failing) => {
    const error = new Error(faker.lorem.sentence());
    failing.mockRejectedValue(error);

    const result = await subscribeToNewsletterAction(EMAIL);

    expect(result).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      SUBSCRIBE_FAILED_EVENT,
      { error },
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
      const error = new Error(faker.lorem.sentence());
      resolveSubscriber(outcome);
      markNewsletterSubscribedMock.mockRejectedValue(error);

      const result = await subscribeToNewsletterAction(EMAIL);

      expect(result).toEqual(expected);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        COOKIE_SET_FAILED_EVENT,
        { error },
      );
    },
  );
});
