import {
  ACTION_OUTCOME,
  SUBSCRIBER_OUTCOME,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
import {
  CONFIRMATION_RESEND_FAILED_EVENT,
  UNSUBSCRIBE_FAILED_EVENT,
} from '@web/constants/newsletter';
import { logger } from '@web/utils/logger/logger';

import {
  resendConfirmationAction,
  unsubscribeAction,
} from './newsletter-subscription-actions';

const {
  authMock,
  unsubscribeMock,
  resendConfirmationMock,
  deliverNewsletterConfirmationMock,
  clearNewsletterSubscribedCookieMock,
  resolveWritableTenantMock,
  resolveRequestTenantMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  unsubscribeMock: vi.fn(),
  resendConfirmationMock: vi.fn(),
  deliverNewsletterConfirmationMock: vi.fn(),
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
    },
  },
}));

vi.mock(
  '@web/server/newsletter/newsletter-confirmation-send/newsletter-confirmation-send',
  () => ({ deliverNewsletterConfirmation: deliverNewsletterConfirmationMock }),
);

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

const TENANT_ID = faker.string.uuid();
const USER_ID = faker.string.uuid();
const SUBSCRIBER_ID = faker.string.uuid();
const SUBSCRIBER_EMAIL = faker.internet.email();
const CONFIRMATION_TOKEN = faker.string.alphanumeric(16);
const SUCCESS = toOutcome(ACTION_OUTCOME.SUCCESS);
const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);

describe(unsubscribeAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    unsubscribeMock.mockResolvedValue(undefined);
    clearNewsletterSubscribedCookieMock.mockResolvedValue(undefined);
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
    });
  });

  it.each([
    TENANT_STATUS.ACTIVE,
    TENANT_STATUS.SUSPENDED,
    TENANT_STATUS.ARCHIVED,
  ])(
    'unsubscribes the reader and clears the cookie on a %s tenant',
    async (status) => {
      resolveRequestTenantMock.mockResolvedValue({ id: TENANT_ID, status });

      expect(await unsubscribeAction()).toEqual(SUCCESS);
      expect(unsubscribeMock).toHaveBeenCalledWith(TENANT_ID, USER_ID);
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
    const error = new Error(faker.lorem.sentence());
    unsubscribeMock.mockRejectedValue(error);

    expect(await unsubscribeAction()).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      UNSUBSCRIBE_FAILED_EVENT,
      { error },
    );
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('still succeeds and logs when clearing the cookie throws', async () => {
    const error = new Error(faker.lorem.sentence());
    clearNewsletterSubscribedCookieMock.mockRejectedValue(error);

    expect(await unsubscribeAction()).toEqual(SUCCESS);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'newsletter.subscribed_cookie_clear_failed',
      { error },
    );
  });
});

describe(resendConfirmationAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    resendConfirmationMock.mockResolvedValue({
      ...toOutcome(SUBSCRIBER_OUTCOME.PENDING),
      subscriberId: SUBSCRIBER_ID,
      email: SUBSCRIBER_EMAIL,
      confirmationToken: CONFIRMATION_TOKEN,
    });
    deliverNewsletterConfirmationMock.mockResolvedValue(undefined);
    resolveWritableTenantMock.mockResolvedValue({
      ok: true,
      tenantId: TENANT_ID,
    });
  });

  it("emails a new confirmation to the subscriber's stored address", async () => {
    expect(await resendConfirmationAction()).toEqual(SUCCESS);
    expect(resendConfirmationMock).toHaveBeenCalledWith(TENANT_ID, USER_ID);
    expect(deliverNewsletterConfirmationMock).toHaveBeenCalledWith(
      TENANT_ID,
      { subscriberId: SUBSCRIBER_ID, email: SUBSCRIBER_EMAIL },
      CONFIRMATION_TOKEN,
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
        resolveWritableTenantMock.mockResolvedValue({
          ok: false,
          reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
        }),
    ],
    [
      'unavailable for an inactive tenant',
      toOutcome(ACTION_OUTCOME.UNAVAILABLE),
      () =>
        resolveWritableTenantMock.mockResolvedValue({
          ok: false,
          reason: TENANT_WRITE_REFUSAL.INACTIVE,
        }),
    ],
  ])('answers %s without resending', async (_case, expected, arrange) => {
    arrange();

    expect(await resendConfirmationAction()).toEqual(expected);
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(deliverNewsletterConfirmationMock).not.toHaveBeenCalled();
  });

  it('answers server-error without emailing when nothing is pending', async () => {
    resendConfirmationMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING),
    );

    expect(await resendConfirmationAction()).toEqual(SERVER_ERROR);
    expect(deliverNewsletterConfirmationMock).not.toHaveBeenCalled();
  });

  it('answers server-error and logs when the email fails', async () => {
    const error = new Error(faker.lorem.sentence());
    deliverNewsletterConfirmationMock.mockRejectedValue(error);

    expect(await resendConfirmationAction()).toEqual(SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      CONFIRMATION_RESEND_FAILED_EVENT,
      { error },
    );
  });
});
