import { faker } from '@faker-js/faker';
import { ENTITLEMENT_GRANT_LOG } from '@platform/constants/entitlement-grant';
import enMessages from '@platform/i18n/messages/en.json';
import nlMessages from '@platform/i18n/messages/nl.json';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import {
  MOCK_OWNER_EMAIL_FROM_ADDRESS,
  MOCK_OWNER_EMAIL_SEND_ERROR,
  MOCK_PLATFORM_APP_BASE_URL,
} from '@platform/testing/owner-email/fixtures';
import {
  getTenantOwnerEmailMock,
  mockOwnerEmailDb,
} from '@platform/testing/owner-email/mock-owner-email-db';
import {
  MOCK_GRANT_ID,
  MOCK_INVITED_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockEntitlementGrantRow,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { formatDate } from '@platform/utils/format-date/format-date';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { LOCALE_ISO_CODES } from '@shinefold/config';
import { sendEmail } from '@shinefold/email';

import {
  notifyOwnerOfEntitlementGrant,
  notifyOwnerOfEntitlementRevoke,
} from './notify-owner-of-entitlement-change';

vi.mock('@platform/utils/env/env');

vi.mock('@shinefold/db', () => mockOwnerEmailDb());

vi.mock('@shinefold/email');

const sendEmailMock = vi.mocked(sendEmail);
const { granted, revoked } = enMessages.ownerEntitlementEmail;
const CONTACT_FORM_LABEL = enMessages.featuresSettings.toggleLabel.CONTACT_FORM;
const MOCK_FUTURE_EXPIRY = faker.date.future();
const MOCK_PAST_EXPIRY = faker.date.past();

const sentEmail = () => sendEmailMock.mock.calls[0]?.[0];

const grantContactForm = (overrides = {}) =>
  notifyOwnerOfEntitlementGrant(
    mockTenant(),
    mockEntitlementGrantRow(overrides),
  );

beforeEach(() => {
  mockedEnv.OWNER_EMAIL_FROM_ADDRESS = MOCK_OWNER_EMAIL_FROM_ADDRESS;
  mockedEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
  getTenantOwnerEmailMock.mockReset().mockResolvedValue(MOCK_OWNER_EMAIL);
  sendEmailMock.mockReset().mockResolvedValue(undefined);
  vi.mocked(logger.warn).mockReset();
  vi.mocked(logger.error).mockReset();
});

describe(notifyOwnerOfEntitlementGrant, () => {
  describe('a grant that lasts until revoked', () => {
    beforeEach(async () => {
      await grantContactForm();
    });

    it('emails the owner once from the owner sender', () => {
      expect(sendEmailMock).toHaveBeenCalledOnce();
      expect(sentEmail()).toMatchObject({
        to: MOCK_OWNER_EMAIL,
        from: MOCK_OWNER_EMAIL_FROM_ADDRESS,
      });
    });

    it('names the site and the item in the Grants card’s words', () => {
      const email = sentEmail();

      expect(email?.subject).toContain(MOCK_TENANT_NAME);
      expect(email?.subject).toContain(CONTACT_FORM_LABEL);
    });

    it('says it lasts until revoked and that nothing is charged', () => {
      const text = sentEmail()?.text;

      expect(text).toContain(granted.untilRevoked);
      expect(text).toContain(granted.free);
    });

    it('links to the site’s dashboard', () => {
      expect(sentEmail()?.text).toContain(
        new URL(
          adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID),
          MOCK_PLATFORM_APP_BASE_URL,
        ).toString(),
      );
    });
  });

  it('names the end date of a grant that expires', async () => {
    await grantContactForm({ expiresAt: MOCK_FUTURE_EXPIRY });

    const text = sentEmail()?.text;

    expect(text).toContain(formatDate(MOCK_FUTURE_EXPIRY, LOCALE_ISO_CODES.EN));
    expect(text).not.toContain(granted.untilRevoked);
  });

  it('writes the email in the site’s default language', async () => {
    await notifyOwnerOfEntitlementGrant(
      mockTenant({ locale: LOCALE_ISO_CODES.NL }),
      mockEntitlementGrantRow(),
    );

    expect(sentEmail()?.text).toContain(
      nlMessages.ownerEntitlementEmail.granted.free,
    );
  });

  it('emails an owner who has not joined yet at the invited address', async () => {
    getTenantOwnerEmailMock.mockResolvedValue(MOCK_INVITED_OWNER_EMAIL);

    await grantContactForm();

    expect(sentEmail()?.to).toBe(MOCK_INVITED_OWNER_EMAIL);
  });

  it.each([
    [
      'the tenant has no owner address',
      () => getTenantOwnerEmailMock.mockResolvedValue(undefined),
      ENTITLEMENT_GRANT_LOG.EMAIL_OWNER_MISSING,
    ],
    [
      'no owner sender address is set',
      () => {
        mockedEnv.OWNER_EMAIL_FROM_ADDRESS = undefined;
      },
      ENTITLEMENT_GRANT_LOG.EMAIL_UNCONFIGURED,
    ],
  ])('skips and logs when %s', async (_, misconfigure, logEvent) => {
    misconfigure();

    await grantContactForm();

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(logEvent, {
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('logs a failed send without throwing', async () => {
    sendEmailMock.mockRejectedValue(MOCK_OWNER_EMAIL_SEND_ERROR);

    await expect(grantContactForm()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      ENTITLEMENT_GRANT_LOG.EMAIL_FAILED,
      expect.objectContaining({
        tenantId: MOCK_TENANT_ID,
        grantId: MOCK_GRANT_ID,
      }),
    );
  });
});

describe(notifyOwnerOfEntitlementRevoke, () => {
  it.each([
    ['lasts until revoked', null],
    ['has not reached its end date', MOCK_FUTURE_EXPIRY],
  ])(
    'emails the owner once, naming the item and that nothing is deleted, when the grant %s',
    async (_, expiresAt) => {
      await notifyOwnerOfEntitlementRevoke(
        mockTenant(),
        mockEntitlementGrantRow({ expiresAt }),
      );

      expect(sendEmailMock).toHaveBeenCalledOnce();
      expect(sentEmail()?.subject).toContain(CONTACT_FORM_LABEL);
      expect(sentEmail()?.text).toContain(revoked.kept);
    },
  );

  it('sends nothing when the grant had already ended by its date', async () => {
    await notifyOwnerOfEntitlementRevoke(
      mockTenant(),
      mockEntitlementGrantRow({ expiresAt: MOCK_PAST_EXPIRY }),
    );

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
