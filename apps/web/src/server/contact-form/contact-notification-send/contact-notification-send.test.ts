import { queries } from '@blog/db';
import { sendEmail } from '@blog/email';
import type * as TEmail from '@blog/email';
import { faker } from '@faker-js/faker';
import { mockLeadInput } from '@web/testing/server/contact-form/fixtures';
import { firstSentEmail } from '@web/testing/server/newsletter/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';

import { sendContactNotification } from './contact-notification-send';

vi.mock('@web/utils/env/env');

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { getContactRecipient: vi.fn(), getEmailConfig: vi.fn() },
    tenants: { getTenantById: vi.fn() },
    siteConfig: { getSiteConfig: vi.fn() },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof TEmail>()),
  sendEmail: vi.fn(),
}));

faker.seed(6010);

const MOCK_PLATFORM_URL = `https://${faker.internet.domainName()}`;
const MOCK_FROM_ADDRESS = `${faker.company.name()} <${faker.internet.email()}>`;
const MOCK_RECIPIENT = faker.internet.email();
const MOCK_LEAD = mockLeadInput();

describe(sendContactNotification, () => {
  beforeEach(() => {
    Object.assign(env, {
      PLATFORM_APP_URL: MOCK_PLATFORM_URL,
      NEWSLETTER_FROM_ADDRESS: MOCK_FROM_ADDRESS,
    });
    vi.mocked(queries.siteConfig.getSiteConfig).mockResolvedValue(undefined);
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(mockTenant());
    vi.mocked(queries.emailConfig.getContactRecipient).mockResolvedValue(
      MOCK_RECIPIENT,
    );
    vi.mocked(queries.emailConfig.getEmailConfig).mockResolvedValue(undefined);
  });

  it('emails the recipient with Reply-To set to the visitor', async () => {
    await sendContactNotification(MOCK_LEAD);

    const { to, from, replyTo, subject } = firstSentEmail(vi.mocked(sendEmail));
    expect(to).toBe(MOCK_RECIPIENT);
    expect(from).toBe(MOCK_FROM_ADDRESS);
    expect(replyTo).toBe(MOCK_LEAD.email);
    expect(subject).toContain(MOCK_LEAD.name);
  });

  it('links the page the message came from and the leads list', async () => {
    await sendContactNotification(MOCK_LEAD);

    const { html } = firstSentEmail(vi.mocked(sendEmail));
    expect(html).toContain(
      `href="${MOCK_TENANT_BASE_URL}${MOCK_LEAD.sourcePath}"`,
    );
    expect(html).toContain(`href="${MOCK_PLATFORM_URL}/dashboard/leads"`);
  });

  it('sends with an inert leads link and warns when the admin URL is unset', async () => {
    Object.assign(env, { PLATFORM_APP_URL: undefined });

    await sendContactNotification(MOCK_LEAD);

    const { html } = firstSentEmail(vi.mocked(sendEmail));
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(html).not.toContain(MOCK_PLATFORM_URL);
    expect(logger.warn).toHaveBeenCalledWith(
      'contact_form.platform_url_missing',
    );
  });

  it('throws without sending when the tenant has no recipient', async () => {
    vi.mocked(queries.emailConfig.getContactRecipient).mockResolvedValueOnce(
      undefined,
    );

    await expect(sendContactNotification(MOCK_LEAD)).rejects.toThrow();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
