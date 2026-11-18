import { faker } from '@faker-js/faker';
import { TENANT_LOG } from '@platform/constants/tenant';
import deMessages from '@platform/i18n/messages/de.json';
import enMessages from '@platform/i18n/messages/en.json';
import esMessages from '@platform/i18n/messages/es.json';
import frMessages from '@platform/i18n/messages/fr.json';
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
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes, tenantSiteUrl } from '@platform/utils/routes/routes';
import { LOCALE_ISO_CODES, routes } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { sendEmail } from '@shinefold/email';

import { notifyOwnerOfPlanChange } from './notify-owner-of-plan-change';

vi.mock('@platform/utils/env/env');

vi.mock('@shinefold/db', () => mockOwnerEmailDb());

vi.mock('@shinefold/email');

const sendEmailMock = vi.mocked(sendEmail);

const MOCK_MARKETING_SITE_URL = faker.internet.url({ appendSlash: false });
const PRICING_URL = new URL(routes.pricingComparison(), MOCK_MARKETING_SITE_URL)
  .href;

const sentEmail = () => sendEmailMock.mock.calls[0]?.[0];

const notifyDowngrade = () =>
  notifyOwnerOfPlanChange(MOCK_TENANT_ID, TENANT_PLAN.GROWTH, TENANT_PLAN.FREE);

describe(notifyOwnerOfPlanChange, () => {
  beforeEach(() => {
    mockedEnv.OWNER_EMAIL_FROM_ADDRESS = MOCK_OWNER_EMAIL_FROM_ADDRESS;
    mockedEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
    mockedEnv.MARKETING_SITE_URL = MOCK_MARKETING_SITE_URL;
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
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

  it('emails the owner once, naming Starter, when the site moves from Free to Starter', async () => {
    await notifyOwnerOfPlanChange(
      MOCK_TENANT_ID,
      TENANT_PLAN.FREE,
      TENANT_PLAN.STARTER,
    );

    expect(sendEmailMock).toHaveBeenCalledOnce();
    expect(sentEmail()?.subject).toBe(
      enMessages.ownerPlanChangeEmail.STARTER.subject,
    );
  });

  it.each([
    [LOCALE_ISO_CODES.EN, enMessages],
    [LOCALE_ISO_CODES.DE, deMessages],
    [LOCALE_ISO_CODES.ES, esMessages],
    [LOCALE_ISO_CODES.FR, frMessages],
    [LOCALE_ISO_CODES.NL, nlMessages],
  ])(
    'links a %s email to the pricing page’s plan comparison',
    async (locale, messages) => {
      getTenantByIdMock.mockResolvedValue(mockTenant({ locale }));

      await notifyDowngrade();

      expect(sentEmail()?.text).toContain(
        `${messages.ownerPlanChangeEmail.plansLinkLabel}: ${PRICING_URL}`,
      );
    },
  );

  describe('without a marketing site URL', () => {
    beforeEach(() => {
      mockedEnv.MARKETING_SITE_URL = undefined;
    });

    it('links to the root domain’s pricing page', async () => {
      await notifyDowngrade();

      expect(sentEmail()?.text).toContain(
        new URL(
          routes.pricingComparison(),
          tenantSiteUrl(MOCK_TENANT_ROOT_DOMAIN),
        ).href,
      );
    });

    it('still sends, without the pricing link, when no root domain is set either', async () => {
      mockedEnv.TENANT_ROOT_DOMAIN = undefined;

      await notifyDowngrade();

      expect(sendEmailMock).toHaveBeenCalledOnce();
      expect(sentEmail()?.text).not.toContain(routes.pricingComparison());
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
