import {
  ACTION_OUTCOME,
  PRESET_ID,
  resolveTenantEmailBrand,
  routes,
  SUBSCRIBER_OUTCOME,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
import {
  CONFIRMATION_RESEND_FAILED_EVENT,
  UNSUBSCRIBE_FAILED_EVENT,
} from '@web/constants/newsletter';
import {
  firstSentEmail,
  MOCK_CONFIRMATION_TOKEN,
  mockEmailConfig,
  mockEmailTemplate,
} from '@web/testing/server/newsletter/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSubscriber } from '@web/testing/shared/subscriber/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  resendConfirmationAction,
  unsubscribeAction,
} from './newsletter-subscription-actions';

const { MOCK_UNSUBSCRIBE_KEY } = vi.hoisted(() => ({
  MOCK_UNSUBSCRIBE_KEY: Buffer.alloc(32, 1).toString('base64'),
}));

const {
  authMock,
  unsubscribeMock,
  resendConfirmationMock,
  commitConfirmationTokenMock,
  getEmailConfigMock,
  getEmailTemplateMock,
  resolveTenantEmailIdentityMock,
  sendEmailMock,
  clearNewsletterSubscribedCookieMock,
  resolveWritableTenantMock,
  resolveRequestTenantMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  unsubscribeMock: vi.fn(),
  resendConfirmationMock: vi.fn(),
  commitConfirmationTokenMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
  resolveTenantEmailIdentityMock: vi.fn(),
  sendEmailMock: vi.fn(),
  clearNewsletterSubscribedCookieMock: vi.fn(),
  resolveWritableTenantMock: vi.fn(),
  resolveRequestTenantMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    subscribers: {
      unsubscribe: unsubscribeMock,
      resendConfirmation: resendConfirmationMock,
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

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/utils/env/env', () => ({
  env: {
    NEWSLETTER_FROM_ADDRESS: undefined,
    NEWSLETTER_UNSUBSCRIBE_KEY: MOCK_UNSUBSCRIBE_KEY,
  },
}));

vi.mock(
  '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie',
  () => ({
    clearNewsletterSubscribedCookie: clearNewsletterSubscribedCookieMock,
  }),
);

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: resolveRequestTenantMock,
}));

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
}));

const USER_ID = faker.string.uuid();
const MOCK_SUBSCRIBER = mockSubscriber();
const MOCK_BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ max: 359 }),
});
const SUCCESS = toOutcome(ACTION_OUTCOME.SUCCESS);
const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);

describe(unsubscribeAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    unsubscribeMock.mockResolvedValue(undefined);
    clearNewsletterSubscribedCookieMock.mockResolvedValue(undefined);
    resolveRequestTenantMock.mockResolvedValue(mockTenant());
  });

  it.each([
    TENANT_STATUS.ACTIVE,
    TENANT_STATUS.SUSPENDED,
    TENANT_STATUS.ARCHIVED,
  ])(
    'unsubscribes the reader and clears the cookie on a %s tenant',
    async (status) => {
      resolveRequestTenantMock.mockResolvedValue(mockTenant({ status }));

      expect(await unsubscribeAction()).toEqual(SUCCESS);
      expect(unsubscribeMock).toHaveBeenCalledWith(MOCK_TENANT_ID, USER_ID);
      expect(clearNewsletterSubscribedCookieMock).toHaveBeenCalledOnce();
    },
  );

  it.each([
    ['no session', () => authMock.mockResolvedValue(null)],
    ['no tenant', () => resolveRequestTenantMock.mockResolvedValue(undefined)],
  ])(
    'answers server-error with %s and changes nothing',
    async (_case, arrange) => {
      arrange();

      expect(await unsubscribeAction()).toEqual(SERVER_ERROR);
      expect(unsubscribeMock).not.toHaveBeenCalled();
      expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
    },
  );

  it('answers server-error, logs and keeps the cookie when the db write throws', async () => {
    unsubscribeMock.mockRejectedValue(MOCK_ERROR);

    expect(await unsubscribeAction()).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      UNSUBSCRIBE_FAILED_EVENT,
      { error: MOCK_ERROR },
    );
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('still succeeds and logs when clearing the cookie throws', async () => {
    clearNewsletterSubscribedCookieMock.mockRejectedValue(MOCK_ERROR);

    expect(await unsubscribeAction()).toEqual(SUCCESS);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'newsletter.subscribed_cookie_clear_failed',
      { error: MOCK_ERROR },
    );
  });
});

describe(resendConfirmationAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    resendConfirmationMock.mockResolvedValue({
      ...toOutcome(SUBSCRIBER_OUTCOME.PENDING),
      subscriberId: MOCK_SUBSCRIBER.id,
      email: MOCK_SUBSCRIBER.email,
      confirmationToken: MOCK_CONFIRMATION_TOKEN,
    });
    sendEmailMock.mockResolvedValue(undefined);
    commitConfirmationTokenMock.mockResolvedValue(undefined);
    getEmailConfigMock.mockResolvedValue(mockEmailConfig());
    getEmailTemplateMock.mockResolvedValue(mockEmailTemplate());
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: MOCK_BRAND,
      brandName: faker.company.name(),
    });
    resolveWritableTenantMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
  });

  it("emails a new confirmation to the subscriber's stored address", async () => {
    expect(await resendConfirmationAction()).toEqual(SUCCESS);
    expect(resendConfirmationMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      USER_ID,
    );
    const { to, html } = firstSentEmail(sendEmailMock);
    expect(to).toBe(MOCK_SUBSCRIBER.email);
    expect(html).toContain(
      `${MOCK_TENANT_BASE_URL}${routes.newsletterConfirm(MOCK_CONFIRMATION_TOKEN)}`,
    );
    expect(commitConfirmationTokenMock).toHaveBeenCalledWith(
      MOCK_SUBSCRIBER.id,
      MOCK_CONFIRMATION_TOKEN,
    );
  });

  it.each([
    [
      'server-error with no session',
      SERVER_ERROR,
      () => authMock.mockResolvedValue(null),
    ],
    [
      'server-error with no tenant',
      SERVER_ERROR,
      () =>
        resolveWritableTenantMock.mockResolvedValue(
          errorResult(TENANT_WRITE_REFUSAL.UNRESOLVED),
        ),
    ],
    [
      'unavailable for an inactive tenant',
      toOutcome(ACTION_OUTCOME.UNAVAILABLE),
      () =>
        resolveWritableTenantMock.mockResolvedValue(
          errorResult(TENANT_WRITE_REFUSAL.INACTIVE),
        ),
    ],
  ])('answers %s without resending', async (_case, expected, arrange) => {
    arrange();

    expect(await resendConfirmationAction()).toEqual(expected);
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('answers server-error without emailing when nothing is pending', async () => {
    resendConfirmationMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING),
    );

    expect(await resendConfirmationAction()).toEqual(SERVER_ERROR);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('answers server-error and logs when the email fails', async () => {
    sendEmailMock.mockRejectedValue(MOCK_ERROR);

    expect(await resendConfirmationAction()).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      CONFIRMATION_RESEND_FAILED_EVENT,
      { error: MOCK_ERROR },
    );
  });
});
