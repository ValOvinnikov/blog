import {
  ACTION_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  PRESET_ID,
  resolveTenantEmailBrand,
  SUBSCRIBER_OUTCOME,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import { type TSendEmailInput } from '@blog/email';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import {
  CONFIRMATION_RESEND_FAILED_EVENT,
  UNSUBSCRIBE_FAILED_EVENT,
} from '@web/constants/newsletter';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import {
  MOCK_CONFIRMATION_TOKEN,
  MOCK_REPLY_TO,
  MOCK_UNSUBSCRIBE_HEADERS,
  MOCK_UNSUBSCRIBE_TOKEN,
  mockEmailConfig,
} from '@web/testing/server/newsletter/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

const {
  authMock,
  unsubscribeMock,
  resendConfirmationMock,
  commitConfirmationTokenMock,
  mintNewsletterUnsubscribeTokenMock,
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
  commitConfirmationTokenMock: vi.fn(),
  mintNewsletterUnsubscribeTokenMock: vi.fn(),
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
    clearNewsletterSubscribedCookie: clearNewsletterSubscribedCookieMock,
  }),
);

vi.mock(
  '@web/server/newsletter/newsletter-unsubscribe-token/newsletter-unsubscribe-token',
  () => ({
    mintNewsletterUnsubscribeToken: mintNewsletterUnsubscribeTokenMock,
  }),
);

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: resolveRequestTenantMock,
}));

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
}));

const USER_ID = faker.string.uuid();
const SUBSCRIBER_ID = faker.string.uuid();

vi.mock('@web/utils/env/env', () => ({
  env: { NEWSLETTER_FROM_ADDRESS: undefined },
}));

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

type TActions = typeof import('./newsletter-subscription-actions');

const SESSION_EMAIL = faker.internet.email();
const NO_SESSION = 'there is no session';
const NO_TENANT = 'no tenant resolves';
const session = {
  user: { id: USER_ID, email: SESSION_EMAIL },
};

const sentEmail = (): TSendEmailInput => {
  const [[email]] = sendEmailMock.mock.calls as [[TSendEmailInput]];
  return email;
};

describe('unsubscribeAction', () => {
  let unsubscribeAction: TActions['unsubscribeAction'];

  beforeEach(async () => {
    authMock.mockReset();
    authMock.mockResolvedValue(session);
    unsubscribeMock.mockReset();
    unsubscribeMock.mockResolvedValue(undefined);
    clearNewsletterSubscribedCookieMock.mockReset();
    clearNewsletterSubscribedCookieMock.mockResolvedValue(undefined);
    resolveRequestTenantMock.mockReset();
    resolveRequestTenantMock.mockResolvedValue({
      id: MOCK_TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
    });
    ({ unsubscribeAction } = await import('./newsletter-subscription-actions'));
  });

  it.each([
    [NO_SESSION, () => authMock.mockResolvedValue(null)],
    [NO_TENANT, () => resolveRequestTenantMock.mockResolvedValue(undefined)],
  ])(
    'returns SERVER_ERROR without unsubscribing when %s',
    async (_, arrange) => {
      arrange();

      await expect(unsubscribeAction()).resolves.toEqual({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      expect(unsubscribeMock).not.toHaveBeenCalled();
      expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
    },
  );

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'unsubscribes the session user when the tenant is %s',
    async (status) => {
      resolveRequestTenantMock.mockResolvedValue({
        id: MOCK_TENANT_ID,
        status,
      });

      await expect(unsubscribeAction()).resolves.toEqual({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      expect(unsubscribeMock).toHaveBeenCalledWith(MOCK_TENANT_ID, USER_ID);
    },
  );

  it('unsubscribes the session user, clears the cookie, and returns SUCCESS', async () => {
    await expect(unsubscribeAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(unsubscribeMock).toHaveBeenCalledWith(MOCK_TENANT_ID, USER_ID);
    expect(clearNewsletterSubscribedCookieMock).toHaveBeenCalledTimes(1);
  });

  it('returns SERVER_ERROR, logs and keeps the cookie when the db write throws', async () => {
    unsubscribeMock.mockRejectedValue(MOCK_ERROR);

    await expect(unsubscribeAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      UNSUBSCRIBE_FAILED_EVENT,
      { error: MOCK_ERROR },
    );
    expect(clearNewsletterSubscribedCookieMock).not.toHaveBeenCalled();
  });

  it('still returns SUCCESS, logging, when clearing the cookie throws', async () => {
    clearNewsletterSubscribedCookieMock.mockRejectedValue(MOCK_ERROR);

    await expect(unsubscribeAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'newsletter.subscribed_cookie_clear_failed',
      { error: MOCK_ERROR },
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
      subscriberId: SUBSCRIBER_ID,
      confirmationToken: MOCK_CONFIRMATION_TOKEN,
    });
    commitConfirmationTokenMock.mockReset();
    commitConfirmationTokenMock.mockResolvedValue(undefined);
    mintNewsletterUnsubscribeTokenMock.mockReturnValue(MOCK_UNSUBSCRIBE_TOKEN);
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
    resolveTenantEmailIdentityMock.mockReset();
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: faker.number.int({ max: 359 }),
      }),
      brandName: faker.company.name(),
    });
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue(MOCK_TENANT_BASE_URL);
    resolveWritableTenantMock.mockReset();
    resolveWritableTenantMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
    getEmailConfigMock.mockReset();
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockReset();
    getEmailTemplateMock.mockResolvedValue({
      tenantId: MOCK_TENANT_ID,
      templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      subject: faker.lorem.sentence(),
      body: [],
      logoAssetUrl: undefined,
    });
    ({ resendConfirmationAction } =
      await import('./newsletter-subscription-actions'));
  });

  it.each([
    [
      ACTION_OUTCOME.SERVER_ERROR,
      NO_SESSION,
      () => authMock.mockResolvedValue(null),
    ],
    [
      ACTION_OUTCOME.SERVER_ERROR,
      'the session has no email',
      () => authMock.mockResolvedValue({ user: { id: USER_ID } }),
    ],
    [
      ACTION_OUTCOME.SERVER_ERROR,
      NO_TENANT,
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
  ])('returns %s without resending when %s', async (outcome, _, arrange) => {
    arrange();

    await expect(resendConfirmationAction()).resolves.toEqual({ outcome });
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('resends the confirmation email to the session email and returns SUCCESS', async () => {
    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(resendConfirmationMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      USER_ID,
    );
    const { to, html, headers } = sentEmail();
    expect(to).toBe(SESSION_EMAIL);
    expect(html).toContain(
      `${MOCK_TENANT_BASE_URL}/api/newsletter/confirm?token=${MOCK_CONFIRMATION_TOKEN}`,
    );
    expect(headers).toEqual(MOCK_UNSUBSCRIBE_HEADERS);
  });

  it('stores the new confirm token only once the email is sent', async () => {
    await resendConfirmationAction();

    expect(commitConfirmationTokenMock).toHaveBeenCalledWith(
      SUBSCRIBER_ID,
      MOCK_CONFIRMATION_TOKEN,
    );
    expect(sendEmailMock.mock.invocationCallOrder[0]).toBeLessThan(
      commitConfirmationTokenMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('signs the same unsubscribe link for the subscriber as every earlier email', async () => {
    await resendConfirmationAction();

    expect(mintNewsletterUnsubscribeTokenMock).toHaveBeenCalledWith(
      SUBSCRIBER_ID,
    );
  });

  it("renders the subscribing tenant's own brand in the resent confirmation email", async () => {
    const tenantBrand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: faker.number.int({ max: 359 }),
    });
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: tenantBrand,
      brandName: faker.company.name(),
    });

    await resendConfirmationAction();

    expect(resolveTenantEmailIdentityMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    const { html } = sentEmail();
    expect(html).toContain(tenantBrand.logo1);
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
    sendEmailMock.mockRejectedValue(MOCK_ERROR);

    await expect(resendConfirmationAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      CONFIRMATION_RESEND_FAILED_EVENT,
      { error: MOCK_ERROR },
    );
    expect(commitConfirmationTokenMock).not.toHaveBeenCalled();
  });

  it('sends with a validated reply-to while preserving the List-Unsubscribe headers', async () => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ replyToAddress: MOCK_REPLY_TO }),
    );

    await resendConfirmationAction();

    const { replyTo, headers } = sentEmail();
    expect(replyTo).toBe(MOCK_REPLY_TO);
    expect(headers).toEqual(MOCK_UNSUBSCRIBE_HEADERS);
  });
});
