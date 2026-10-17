import { PRESET_ID, resolveTenantEmailBrand } from '@blog/config';
import type { schema } from '@blog/db';
import { faker } from '@faker-js/faker';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { logger } from '@web/utils/logger/logger';
import { resolveTenantEmailIdentity } from '@web/utils/resolve-tenant-email-identity';

import { sendContactNotification } from './contact-notification-send';

const { getContactRecipientMock, getEmailConfigMock, sendEmailMock, envMock } =
  vi.hoisted(() => ({
    getContactRecipientMock: vi.fn(),
    getEmailConfigMock: vi.fn(),
    sendEmailMock: vi.fn(),
    envMock: {} as Record<string, string | undefined>,
  }));

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: {
      getContactRecipient: getContactRecipientMock,
      getEmailConfig: getEmailConfigMock,
    },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/email')>()),
  sendEmail: sendEmailMock,
}));

vi.mock('@web/utils/resolve-tenant-email-identity', () => ({
  resolveTenantEmailIdentity: vi.fn(),
}));

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url', () => ({
  getTenantBaseUrl: vi.fn(),
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));
vi.mock('@web/utils/logger/logger');

const SITE_URL = `https://${faker.internet.domainName()}`;
const PLATFORM_URL = `https://${faker.internet.domainName()}`;
const FROM_ADDRESS = `${faker.company.name()} <${faker.internet.email()}>`;
const RECIPIENT = faker.internet.email();

const lead: schema.TLead = {
  id: faker.string.uuid(),
  tenantId: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  message: faker.lorem.sentences(2),
  sourcePath: `/${faker.lorem.slug()}`,
  createdAt: faker.date.recent(),
};

describe('sendContactNotification', () => {
  beforeEach(() => {
    envMock.PLATFORM_APP_URL = PLATFORM_URL;
    envMock.NEWSLETTER_FROM_ADDRESS = FROM_ADDRESS;
    vi.mocked(getTenantBaseUrl).mockResolvedValue(SITE_URL);
    vi.mocked(resolveTenantEmailIdentity).mockResolvedValue({
      brandName: faker.company.name(),
      brand: resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: faker.number.int({ min: 0, max: 359 }),
      }),
    });
    getContactRecipientMock.mockResolvedValue(RECIPIENT);
    getEmailConfigMock.mockResolvedValue(undefined);
    sendEmailMock.mockResolvedValue(undefined);
  });

  it('emails the recipient with Reply-To set to the visitor', async () => {
    await sendContactNotification(lead);

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: RECIPIENT,
        from: FROM_ADDRESS,
        replyTo: lead.email,
        subject: `New message from ${lead.name}`,
      }),
    );
  });

  it('links the page the message came from and the leads list', async () => {
    await sendContactNotification(lead);

    const [{ html }] = sendEmailMock.mock.calls[0] as [{ html: string }];
    expect(html).toContain(`href="${SITE_URL}${lead.sourcePath}"`);
    expect(html).toContain(`href="${PLATFORM_URL}/dashboard/leads"`);
  });

  it('sends with an inert leads link and warns when the admin URL is unset', async () => {
    envMock.PLATFORM_APP_URL = undefined;

    await sendContactNotification(lead);

    const [{ html }] = sendEmailMock.mock.calls[0] as [{ html: string }];
    expect(sendEmailMock).toHaveBeenCalledOnce();
    expect(html).not.toContain(PLATFORM_URL);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'contact_form.platform_url_missing',
    );
  });

  it('throws without sending when the tenant has no recipient', async () => {
    getContactRecipientMock.mockResolvedValue(undefined);

    await expect(sendContactNotification(lead)).rejects.toThrow();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
