import {
  LOCALE_ISO_CODES,
  PRESET_ID,
  resolveTenantEmailBrand,
} from '@blog/config';
import { escapeHtml } from '@blog/email';
import { faker } from '@faker-js/faker';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import {
  firstSentEmail,
  MOCK_AUTHORED_SUBJECT,
  MOCK_CONFIRMATION_TOKEN,
  MOCK_REPLY_TO,
  MOCK_UNSUBSCRIBE_HEADERS,
  MOCK_UNSUBSCRIBE_TOKEN,
  MOCK_UNSUBSCRIBE_URL,
  mockEmailConfig,
  mockEmailTemplate,
} from '@web/testing/server/newsletter/fixtures';
import { mockSubscriber } from '@web/testing/shared/subscriber/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
import { getLocale } from 'next-intl/server';

import { sendNewsletterConfirmation } from './newsletter-confirmation-send';

const {
  sendEmailMock,
  resolveTenantEmailIdentityMock,
  getEmailConfigMock,
  getEmailTemplateMock,
  claimConfirmationSendMock,
  releaseConfirmationSendMock,
  commitConfirmationTokenMock,
  mintNewsletterUnsubscribeTokenMock,
} = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  resolveTenantEmailIdentityMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
  claimConfirmationSendMock: vi.fn(),
  releaseConfirmationSendMock: vi.fn(),
  commitConfirmationTokenMock: vi.fn(),
  mintNewsletterUnsubscribeTokenMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    subscribers: {
      claimConfirmationSend: claimConfirmationSendMock,
      releaseConfirmationSend: releaseConfirmationSendMock,
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
  '@web/server/newsletter/newsletter-unsubscribe-token/newsletter-unsubscribe-token',
  () => ({
    mintNewsletterUnsubscribeToken: mintNewsletterUnsubscribeTokenMock,
  }),
);

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/utils/env/env', () => ({
  env: { NEWSLETTER_FROM_ADDRESS: undefined },
}));

const BRAND_NAME = faker.company.name();
const BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ max: 359 }),
});
const CLAIMED_AT = faker.date.recent();
const SEND_ERROR = new Error(faker.lorem.sentence());
const SUBSCRIBER = mockSubscriber();
const CONFIRM_URL = `${MOCK_TENANT_BASE_URL}/api/newsletter/confirm?token=${MOCK_CONFIRMATION_TOKEN}`;

const sentEmail = () => firstSentEmail(sendEmailMock);

describe(sendNewsletterConfirmation, () => {
  beforeEach(() => {
    sendEmailMock.mockResolvedValue(undefined);
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: BRAND,
      brandName: BRAND_NAME,
    });
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ replyToAddress: MOCK_REPLY_TO }),
    );
    getEmailTemplateMock.mockResolvedValue(mockEmailTemplate());
    claimConfirmationSendMock.mockResolvedValue({
      claimedAt: CLAIMED_AT,
      confirmationToken: MOCK_CONFIRMATION_TOKEN,
    });
    releaseConfirmationSendMock.mockResolvedValue(undefined);
    commitConfirmationTokenMock.mockResolvedValue(undefined);
    mintNewsletterUnsubscribeTokenMock.mockReturnValue(MOCK_UNSUBSCRIBE_TOKEN);
    vi.mocked(getTenantBaseUrl).mockResolvedValue(MOCK_TENANT_BASE_URL);
  });

  it('emails the subscriber a confirm link and their own unsubscribe link', async () => {
    await sendNewsletterConfirmation(MOCK_TENANT_ID, SUBSCRIBER);

    const { to, subject, replyTo, headers, html } = sentEmail();
    expect({ to, subject, replyTo, headers }).toEqual({
      to: SUBSCRIBER.email,
      subject: MOCK_AUTHORED_SUBJECT,
      replyTo: MOCK_REPLY_TO,
      headers: MOCK_UNSUBSCRIBE_HEADERS,
    });
    expect(html).toContain(CONFIRM_URL);
    expect(mintNewsletterUnsubscribeTokenMock).toHaveBeenCalledWith(
      SUBSCRIBER.id,
    );
  });

  it('stores the new confirm token only once the email is sent', async () => {
    await sendNewsletterConfirmation(MOCK_TENANT_ID, SUBSCRIBER);

    expect(commitConfirmationTokenMock).toHaveBeenCalledWith(
      SUBSCRIBER.id,
      MOCK_CONFIRMATION_TOKEN,
    );
    expect(sendEmailMock.mock.invocationCallOrder[0]).toBeLessThan(
      commitConfirmationTokenMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('carries the language the reader subscribed in on both links', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce(LOCALE_ISO_CODES.FR);

    await sendNewsletterConfirmation(MOCK_TENANT_ID, SUBSCRIBER);

    const { headers, html } = sentEmail();
    expect(html).toContain(`${CONFIRM_URL}&amp;lang=FR`);
    expect(headers).toEqual({
      ...MOCK_UNSUBSCRIBE_HEADERS,
      'List-Unsubscribe': `<${MOCK_UNSUBSCRIBE_URL}&lang=FR>`,
    });
  });

  it("renders the tenant's own brand and name", async () => {
    await sendNewsletterConfirmation(MOCK_TENANT_ID, SUBSCRIBER);

    const { html } = sentEmail();
    expect(resolveTenantEmailIdentityMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(html).toContain(BRAND.logo1);
    expect(html).toContain(escapeHtml(BRAND_NAME));
  });

  it('sends nothing while the last confirmation is inside its cooldown', async () => {
    claimConfirmationSendMock.mockResolvedValue(null);

    await sendNewsletterConfirmation(MOCK_TENANT_ID, SUBSCRIBER);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('gives back the cooldown and keeps the old token when the send fails', async () => {
    sendEmailMock.mockRejectedValue(SEND_ERROR);

    await expect(
      sendNewsletterConfirmation(MOCK_TENANT_ID, SUBSCRIBER),
    ).rejects.toBe(SEND_ERROR);
    expect(releaseConfirmationSendMock).toHaveBeenCalledWith(
      SUBSCRIBER.id,
      CLAIMED_AT,
    );
    expect(commitConfirmationTokenMock).not.toHaveBeenCalled();
  });

  it('gives back the cooldown when storing the new token fails', async () => {
    commitConfirmationTokenMock.mockRejectedValue(SEND_ERROR);

    await expect(
      sendNewsletterConfirmation(MOCK_TENANT_ID, SUBSCRIBER),
    ).rejects.toBe(SEND_ERROR);
    expect(releaseConfirmationSendMock).toHaveBeenCalledWith(
      SUBSCRIBER.id,
      CLAIMED_AT,
    );
  });
});
