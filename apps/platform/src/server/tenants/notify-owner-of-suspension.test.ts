import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import { sendEmail } from '@blog/email';
import { faker } from '@faker-js/faker';
import { TENANT_LOG } from '@platform/constants/tenant';
import enMessages from '@platform/i18n/messages/en.json';
import nlMessages from '@platform/i18n/messages/nl.json';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OWNER_EMAIL_FROM_ADDRESS,
  MOCK_OWNER_EMAIL_SEND_ERROR,
  MOCK_PLATFORM_APP_BASE_URL,
} from '@platform/testing/owner-email/fixtures';
import {
  MOCK_SUSPENSION_DESCRIPTION,
  MOCK_SUSPENSION_REFERENCE,
  mockTenantSuspension,
} from '@platform/testing/tenant-suspensions/fixtures';
import {
  mockTenant,
  MOCK_INVITED_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';

import { notifyOwnerOfSuspension } from './notify-owner-of-suspension';

const { getTenantOwnerEmailMock } = vi.hoisted(() => ({
  getTenantOwnerEmailMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getTenantOwnerEmail: getTenantOwnerEmailMock },
  },
}));

vi.mock('@blog/email');

const MOCK_REPLY_TO_ADDRESS = faker.internet.email();
const TENANT = mockTenant();
const SUSPENSION = mockTenantSuspension({ tenantId: MOCK_TENANT_ID });

const sendEmailMock = vi.mocked(sendEmail);

const sentEmail = () => sendEmailMock.mock.calls[0]?.[0];

const withReference = (subject: string) =>
  subject.replace('{reference}', MOCK_SUSPENSION_REFERENCE);

const notifySuspended = () =>
  notifyOwnerOfSuspension(TENANT, SUSPENSION, TENANT_STATUS.SUSPENDED);

describe(notifyOwnerOfSuspension, () => {
  beforeEach(() => {
    mockedEnv.OWNER_EMAIL_FROM_ADDRESS = MOCK_OWNER_EMAIL_FROM_ADDRESS;
    mockedEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
    mockedEnv.SUPPORT_REPLY_TO_ADDRESS = MOCK_REPLY_TO_ADDRESS;
    getTenantOwnerEmailMock.mockReset().mockResolvedValue(MOCK_OWNER_EMAIL);
    sendEmailMock.mockReset().mockResolvedValue(undefined);
    vi.mocked(logger.warn).mockReset();
    vi.mocked(logger.error).mockReset();
  });

  describe('a suspension with everything configured', () => {
    beforeEach(async () => {
      await notifySuspended();
    });

    it('emails the owner the reference, reason and how to contest it', () => {
      const email = sentEmail();

      expect(sendEmailMock).toHaveBeenCalledOnce();
      expect(email).toMatchObject({
        to: MOCK_OWNER_EMAIL,
        from: MOCK_OWNER_EMAIL_FROM_ADDRESS,
        replyTo: MOCK_REPLY_TO_ADDRESS,
        subject: withReference(
          enMessages.ownerSuspensionEmail.SUSPENDED.subject,
        ),
      });
      expect(email?.text).toContain(MOCK_TENANT_NAME);
      expect(email?.text).toContain(
        enMessages.suspensionCategory[SUSPENSION.category],
      );
      expect(email?.text).toContain(MOCK_SUSPENSION_DESCRIPTION);
      expect(email?.text).toContain(
        withReference(enMessages.ownerSuspensionEmail.SUSPENDED.contest),
      );
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

  it('emails the owner that the site is back online under the same reference', async () => {
    await notifyOwnerOfSuspension(TENANT, SUSPENSION, TENANT_STATUS.ACTIVE);

    expect(sentEmail()?.subject).toBe(
      withReference(enMessages.ownerSuspensionEmail.ACTIVE.subject),
    );
  });

  it('writes the email in the site’s default language', async () => {
    await notifyOwnerOfSuspension(
      mockTenant({ locale: LOCALE_ISO_CODES.NL }),
      SUSPENSION,
      TENANT_STATUS.SUSPENDED,
    );

    expect(sentEmail()?.subject).toBe(
      withReference(nlMessages.ownerSuspensionEmail.SUSPENDED.subject),
    );
  });

  it('emails an owner who has not joined yet at the invited address', async () => {
    getTenantOwnerEmailMock.mockResolvedValue(MOCK_INVITED_OWNER_EMAIL);

    await notifySuspended();

    expect(sentEmail()?.to).toBe(MOCK_INVITED_OWNER_EMAIL);
  });

  it('sends without the reply line and logs while no support address is set', async () => {
    mockedEnv.SUPPORT_REPLY_TO_ADDRESS = undefined;

    await notifySuspended();

    const email = sentEmail();
    expect(email?.replyTo).toBeUndefined();
    expect(email?.text).not.toContain(
      withReference(enMessages.ownerSuspensionEmail.SUSPENDED.contest),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      TENANT_LOG.SUSPENSION_EMAIL_REPLY_TO_MISSING,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it.each([
    [
      'the tenant has no owner address',
      () => getTenantOwnerEmailMock.mockResolvedValue(undefined),
      TENANT_LOG.SUSPENSION_EMAIL_OWNER_MISSING,
    ],
    [
      'no owner sender address is set',
      () => {
        mockedEnv.OWNER_EMAIL_FROM_ADDRESS = undefined;
      },
      TENANT_LOG.SUSPENSION_EMAIL_UNCONFIGURED,
    ],
  ])('skips and logs when %s', async (_, misconfigure, logEvent) => {
    misconfigure();

    await notifySuspended();

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(logEvent, {
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('logs a failed send without throwing', async () => {
    sendEmailMock.mockRejectedValue(MOCK_OWNER_EMAIL_SEND_ERROR);

    await expect(notifySuspended()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      TENANT_LOG.SUSPENSION_EMAIL_FAILED,
      expect.objectContaining({
        tenantId: MOCK_TENANT_ID,
        reference: MOCK_SUSPENSION_REFERENCE,
        status: TENANT_STATUS.SUSPENDED,
      }),
    );
  });
});
