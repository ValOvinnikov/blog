import {
  ACTION_OUTCOME,
  PRESET_ID,
  resolveTenantEmailBrand,
  routes,
  SUBSCRIBER_OUTCOME,
} from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { setConfirmationEmailDefaults } from '@web/testing/server/newsletter/confirmation-email-defaults';
import { confirmationEmailEdges } from '@web/testing/server/newsletter/confirmation-email-edges';
import {
  firstSentEmail,
  MOCK_CONFIRMATION_TOKEN,
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

const {
  authMock,
  unsubscribeMock,
  resendConfirmationMock,
  cookiesMock,
  deleteCookieMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  unsubscribeMock: vi.fn(),
  resendConfirmationMock: vi.fn(),
  cookiesMock: vi.fn(),
  deleteCookieMock: vi.fn(),
}));

const {
  sendEmail: sendEmailMock,
  commitConfirmationToken: commitConfirmationTokenMock,
} = confirmationEmailEdges;

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: (
    await import('@web/testing/server/newsletter/confirmation-email-edges')
  ).confirmationEmailQueries({
    unsubscribe: unsubscribeMock,
    resendConfirmation: resendConfirmationMock,
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

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/utils/env/env', async () => ({
  env: (await import('@web/testing/server/newsletter/confirmation-email-edges'))
    .confirmationEmailEnv,
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

faker.seed(8156);

const MOCK_USER_ID = faker.string.uuid();
const MOCK_SESSION = { user: { id: MOCK_USER_ID } };
const MOCK_SUBSCRIBER = mockSubscriber();
const MOCK_BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ max: 359 }),
});
const SUCCESS = toOutcome(ACTION_OUTCOME.SUCCESS);
const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);
const UNAVAILABLE = toOutcome(ACTION_OUTCOME.UNAVAILABLE);

describe(unsubscribeAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue(MOCK_SESSION);
    unsubscribeMock.mockResolvedValue(undefined);
    cookiesMock.mockResolvedValue({ delete: deleteCookieMock });
  });

  it.each([
    TENANT_STATUS.ACTIVE,
    TENANT_STATUS.SUSPENDED,
    TENANT_STATUS.ARCHIVED,
  ])(
    'unsubscribes the reader and clears the cookie on a %s tenant',
    async (status) => {
      vi.mocked(resolveRequestTenant).mockResolvedValueOnce(
        mockTenant({ status }),
      );

      const result = await unsubscribeAction();

      expect(result).toEqual(SUCCESS);
      expect(unsubscribeMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_USER_ID,
      );
      expect(deleteCookieMock).toHaveBeenCalledOnce();
    },
  );

  it.each([
    ['no session', () => authMock.mockResolvedValue(null)],
    [
      'no tenant',
      () => vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined),
    ],
  ])(
    'answers server-error with %s and changes nothing',
    async (_case, arrange) => {
      arrange();

      const result = await unsubscribeAction();

      expect(result).toEqual(SERVER_ERROR);
      expect(unsubscribeMock).not.toHaveBeenCalled();
      expect(deleteCookieMock).not.toHaveBeenCalled();
    },
  );

  it('answers server-error, logs and keeps the cookie when the db write throws', async () => {
    unsubscribeMock.mockRejectedValue(MOCK_ERROR);

    const result = await unsubscribeAction();

    expect(result).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      NEWSLETTER_LOG.UNSUBSCRIBE_FAILED,
      { error: MOCK_ERROR },
    );
    expect(deleteCookieMock).not.toHaveBeenCalled();
  });

  it('still succeeds and logs when clearing the cookie throws', async () => {
    cookiesMock.mockRejectedValue(MOCK_ERROR);

    const result = await unsubscribeAction();

    expect(result).toEqual(SUCCESS);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      NEWSLETTER_LOG.SUBSCRIBED_COOKIE_CLEAR_FAILED,
      { error: MOCK_ERROR },
    );
  });
});

describe(resendConfirmationAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue(MOCK_SESSION);
    resendConfirmationMock.mockResolvedValue({
      ...toOutcome(SUBSCRIBER_OUTCOME.PENDING),
      subscriberId: MOCK_SUBSCRIBER.id,
      email: MOCK_SUBSCRIBER.email,
      confirmationToken: MOCK_CONFIRMATION_TOKEN,
    });
    setConfirmationEmailDefaults({ brand: MOCK_BRAND });
  });

  it("emails a new confirmation to the subscriber's stored address", async () => {
    const result = await resendConfirmationAction();

    const { to, html } = firstSentEmail(sendEmailMock);
    expect(result).toEqual(SUCCESS);
    expect(resendConfirmationMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_USER_ID,
    );
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
  ])('answers %s without resending', async (_case, expected, arrange) => {
    arrange();

    const result = await resendConfirmationAction();

    expect(result).toEqual(expected);
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('answers server-error without emailing when nothing is pending', async () => {
    resendConfirmationMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING),
    );

    const result = await resendConfirmationAction();

    expect(result).toEqual(SERVER_ERROR);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('answers server-error and logs when the email fails', async () => {
    sendEmailMock.mockRejectedValue(MOCK_ERROR);

    const result = await resendConfirmationAction();

    expect(result).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      NEWSLETTER_LOG.CONFIRMATION_RESEND_FAILED,
      { error: MOCK_ERROR },
    );
  });
});
