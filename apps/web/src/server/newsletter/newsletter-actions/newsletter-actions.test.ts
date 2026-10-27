import {
  ACTION_OUTCOME,
  ERROR_CODE,
  PRESET_ID,
  resolveTenantEmailBrand,
  SUBSCRIBER_OUTCOME,
} from '@blog/config';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { FORWARDED_FOR_HEADER } from '@blog/utils/client-key';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import { NEWSLETTER_LOG, NEWSLETTER_OUTCOME } from '@web/constants/newsletter';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { setConfirmationEmailDefaults } from '@web/testing/server/newsletter/confirmation-email-defaults';
import { confirmationEmailEdges } from '@web/testing/server/newsletter/confirmation-email-edges';
import { firstSentEmail } from '@web/testing/server/newsletter/fixtures';
import { mockSettingsFeaturesRow } from '@web/testing/server/settings-features/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSubscriber } from '@web/testing/shared/subscriber/fixtures';
import {
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { subscribeToNewsletterAction } from './newsletter-actions';

const {
  createPendingSubscriberMock,
  getTenantByIdMock,
  getSettingsFeaturesMock,
  getSiteConfigMock,
  cookiesMock,
  checkBotIdMock,
  headersMock,
} = vi.hoisted(() => ({
  createPendingSubscriberMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getSettingsFeaturesMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
  cookiesMock: vi.fn(),
  checkBotIdMock: vi.fn(),
  headersMock: vi.fn(),
}));

const { sendEmail: sendEmailMock } = confirmationEmailEdges;

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    ...(
      await import('@web/testing/server/newsletter/confirmation-email-edges')
    ).confirmationEmailQueries({
      createPendingSubscriber: createPendingSubscriberMock,
    }),
    tenants: { getTenantById: getTenantByIdMock },
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
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

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/utils/env/env', async () => ({
  env: (await import('@web/testing/server/newsletter/confirmation-email-edges'))
    .confirmationEmailEnv,
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: headersMock,
}));

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

vi.mock('botid/server', () => ({ checkBotId: checkBotIdMock }));

faker.seed(4623);

const MOCK_SUBSCRIBER = mockSubscriber();
const MOCK_BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ max: 359 }),
});
const SUCCESS = { outcome: ACTION_OUTCOME.SUCCESS };
const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR };
const UNAVAILABLE = { outcome: ACTION_OUTCOME.UNAVAILABLE };
const RATE_LIMITED = { outcome: ACTION_OUTCOME.RATE_LIMITED };
const ALREADY_SUBSCRIBED = { outcome: NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED };

const resolveSubscriber = (outcome: string) =>
  createPendingSubscriberMock.mockResolvedValue(
    okResult({ outcome, subscriber: MOCK_SUBSCRIBER }),
  );

describe(subscribeToNewsletterAction, () => {
  const setCookieMock = vi.fn();

  beforeEach(() => {
    resolveSubscriber(SUBSCRIBER_OUTCOME.CREATED);
    setConfirmationEmailDefaults({ brand: MOCK_BRAND });
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
    );
    getSettingsFeaturesMock.mockResolvedValue(mockSettingsFeaturesRow());
    getSiteConfigMock.mockResolvedValue(undefined);
    cookiesMock.mockResolvedValue({ set: setCookieMock });
    checkBotIdMock.mockResolvedValue({ isBot: false });
    headersMock.mockImplementation(
      async () =>
        new Headers({ [FORWARDED_FOR_HEADER]: faker.internet.ipv4() }),
    );
  });

  it('answers invalid for a malformed email without storing anything', async () => {
    const result = await subscribeToNewsletterAction(faker.lorem.word());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { email: { reason: FIELD_ERROR.INVALID } },
    });
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(setCookieMock).not.toHaveBeenCalled();
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
      expect(setCookieMock).toHaveBeenCalledOnce();
    },
  );

  it('answers already-subscribed for an active subscriber without emailing', async () => {
    resolveSubscriber(SUBSCRIBER_OUTCOME.ALREADY_ACTIVE);

    const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

    expect(result).toEqual(ALREADY_SUBSCRIBED);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(setCookieMock).toHaveBeenCalledOnce();
  });

  it.each([
    [
      'rate-limited for a refused attempt',
      RATE_LIMITED,
      () => checkBotIdMock.mockResolvedValueOnce({ isBot: true }),
    ],
    [
      'server-error when no tenant resolves',
      SERVER_ERROR,
      () => vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined),
    ],
    [
      'unavailable for an inactive tenant',
      UNAVAILABLE,
      () =>
        vi
          .mocked(resolveRequestTenant)
          .mockResolvedValueOnce(
            mockTenant({ status: TENANT_STATUS.SUSPENDED }),
          ),
    ],
    [
      'unavailable with the newsletter switched off',
      UNAVAILABLE,
      () =>
        getSettingsFeaturesMock.mockResolvedValue(
          mockSettingsFeaturesRow({ newsletterEnabled: false }),
        ),
    ],
    [
      'unavailable on a plan without the newsletter',
      UNAVAILABLE,
      () =>
        getTenantByIdMock.mockResolvedValue(
          mockTenant({ plan: TENANT_PLAN.FREE }),
        ),
    ],
  ])('answers %s without storing', async (_case, expected, arrange) => {
    arrange();

    const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

    expect(result).toEqual(expected);
    expect(createPendingSubscriberMock).not.toHaveBeenCalled();
    expect(setCookieMock).not.toHaveBeenCalled();
  });

  it('answers server-error and logs the code when storing fails', async () => {
    createPendingSubscriberMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

    expect(result).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      NEWSLETTER_LOG.SUBSCRIBE_FAILED,
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
      NEWSLETTER_LOG.SUBSCRIBE_FAILED,
      { error: MOCK_ERROR },
    );
    expect(setCookieMock).not.toHaveBeenCalled();
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
      cookiesMock.mockRejectedValue(MOCK_ERROR);

      const result = await subscribeToNewsletterAction(MOCK_SUBSCRIBER.email);

      expect(result).toEqual(expected);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        NEWSLETTER_LOG.SUBSCRIBED_COOKIE_SET_FAILED,
        { error: MOCK_ERROR },
      );
    },
  );
});
