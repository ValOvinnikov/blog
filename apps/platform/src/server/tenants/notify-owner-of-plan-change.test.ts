import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { sendEmail } from '@blog/email';
import { TENANT_LOG } from '@platform/constants/tenant';
import enMessages from '@platform/i18n/messages/en.json';
import nlMessages from '@platform/i18n/messages/nl.json';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import {
  MOCK_OWNER_EMAIL_FROM_ADDRESS,
  MOCK_OWNER_EMAIL_SEND_ERROR,
  MOCK_PLATFORM_APP_BASE_URL,
} from '@platform/testing/owner-email/fixtures';
import {
  getTenantByIdMock,
  getTenantOwnerEmailMock,
  mockOwnerEmailDb,
} from '@platform/testing/owner-email/mock-owner-email-db';
import {
  mockTenant,
  MOCK_INVITED_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';

import { notifyOwnerOfPlanChange } from './notify-owner-of-plan-change';

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => mockOwnerEmailDb());

vi.mock('@blog/email');

const sendEmailMock = vi.mocked(sendEmail);

const sentEmail = () => sendEmailMock.mock.calls[0]?.[0];

const notifyDowngrade = () =>
  notifyOwnerOfPlanChange(MOCK_TENANT_ID, TENANT_PLAN.GROWTH, TENANT_PLAN.FREE);

describe(notifyOwnerOfPlanChange, () => {
  beforeEach(() => {
    mockedEnv.OWNER_EMAIL_FROM_ADDRESS = MOCK_OWNER_EMAIL_FROM_ADDRESS;
    mockedEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
    getTenantByIdMock.mockReset().mockResolvedValue(mockTenant());
    getTenantOwnerEmailMock.mockReset().mockResolvedValue(MOCK_OWNER_EMAIL);
    sendEmailMock.mockReset().mockResolvedValue(undefined);
    vi.mocked(logger.warn).mockReset();
    vi.mocked(logger.error).mockReset();
  });

  describe('a move to Free', () => {
    beforeEach(async () => {
      await notifyDowngrade();
    });

    it('emails the owner the downgrade notice', () => {
      expect(sendEmailMock).toHaveBeenCalledOnce();
      expect(sentEmail()).toMatchObject({
        to: MOCK_OWNER_EMAIL,
        from: MOCK_OWNER_EMAIL_FROM_ADDRESS,
        subject: enMessages.ownerPlanChangeEmail.FREE.subject,
      });
    });

    it('names the site and links to its dashboard', () => {
      const text = sentEmail()?.text;

      expect(text).toContain(MOCK_TENANT_NAME);
      expect(text).toContain(
        new URL(
          adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID),
          MOCK_PLATFORM_APP_BASE_URL,
        ).toString(),
      );
    });
  });

  it('emails the owner the upgrade notice when the plan moves to Growth', async () => {
    await notifyOwnerOfPlanChange(
      MOCK_TENANT_ID,
      TENANT_PLAN.FREE,
      TENANT_PLAN.GROWTH,
    );

    expect(sentEmail()?.subject).toBe(
      enMessages.ownerPlanChangeEmail.GROWTH.subject,
    );
  });

  it('writes the email in the site’s default language', async () => {
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ locale: LOCALE_ISO_CODES.NL }),
    );

    await notifyDowngrade();

    expect(sentEmail()?.subject).toBe(
      nlMessages.ownerPlanChangeEmail.FREE.subject,
    );
  });

  it('emails an owner who has not joined yet at the invited address', async () => {
    getTenantOwnerEmailMock.mockResolvedValue(MOCK_INVITED_OWNER_EMAIL);

    await notifyDowngrade();

    expect(sentEmail()?.to).toBe(MOCK_INVITED_OWNER_EMAIL);
  });

  it('sends nothing when the plan is unchanged', async () => {
    await notifyOwnerOfPlanChange(
      MOCK_TENANT_ID,
      TENANT_PLAN.FREE,
      TENANT_PLAN.FREE,
    );

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'the tenant has no owner address',
      () => getTenantOwnerEmailMock.mockResolvedValue(undefined),
      TENANT_LOG.PLAN_CHANGE_EMAIL_OWNER_MISSING,
    ],
    [
      'no owner sender address is set',
      () => {
        mockedEnv.OWNER_EMAIL_FROM_ADDRESS = undefined;
      },
      TENANT_LOG.PLAN_CHANGE_EMAIL_UNCONFIGURED,
    ],
  ])('skips and logs when %s', async (_, misconfigure, logEvent) => {
    misconfigure();

    await notifyDowngrade();

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(logEvent, {
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('logs a failed send without throwing', async () => {
    sendEmailMock.mockRejectedValue(MOCK_OWNER_EMAIL_SEND_ERROR);

    await expect(notifyDowngrade()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      TENANT_LOG.PLAN_CHANGE_EMAIL_FAILED,
      expect.objectContaining({
        tenantId: MOCK_TENANT_ID,
        fromPlan: TENANT_PLAN.GROWTH,
        toPlan: TENANT_PLAN.FREE,
      }),
    );
  });
});
