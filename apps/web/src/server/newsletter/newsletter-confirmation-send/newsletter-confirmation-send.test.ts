import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  resolveTenantEmailBrand,
} from '@blog/config';
import { escapeHtml, LIST_UNSUBSCRIBE_ONE_CLICK } from '@blog/email';
import { faker } from '@faker-js/faker';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { makeSubscriber } from '@web/testing/shared/subscriber/fixtures';
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

const TENANT_ID = faker.string.uuid();
const SITE_URL = `https://${faker.internet.domainName()}`;
const CONFIRMATION_TOKEN = faker.string.alphanumeric(16);
const UNSUBSCRIBE_TOKEN = faker.string.alphanumeric(16);
const SUBJECT = faker.lorem.sentence();
const REPLY_TO = faker.internet.email();
const BRAND_NAME = faker.company.name();
const BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ max: 359 }),
});
const CLAIMED_AT = faker.date.recent();
const SEND_ERROR = new Error(faker.lorem.sentence());
const SUBSCRIBER = makeSubscriber();
const CONFIRM_URL = `${SITE_URL}/api/newsletter/confirm?token=${CONFIRMATION_TOKEN}`;
const UNSUBSCRIBE_URL = `${SITE_URL}/api/newsletter/unsubscribe?token=${UNSUBSCRIBE_TOKEN}`;

const sentEmail = () => {
  const [email] = sendEmailMock.mock.lastCall ?? [];
  return email;
};

describe(sendNewsletterConfirmation, () => {
  beforeEach(() => {
    sendEmailMock.mockResolvedValue(undefined);
    resolveTenantEmailIdentityMock.mockResolvedValue({
      brand: BRAND,
      brandName: BRAND_NAME,
    });
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: REPLY_TO,
      footerPostalAddress: undefined,
    });
    getEmailTemplateMock.mockResolvedValue({
      tenantId: TENANT_ID,
      templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      subject: SUBJECT,
      body: [],
      logoAssetUrl: undefined,
    });
    claimConfirmationSendMock.mockResolvedValue({
      claimedAt: CLAIMED_AT,
      confirmationToken: CONFIRMATION_TOKEN,
    });
    releaseConfirmationSendMock.mockResolvedValue(undefined);
    commitConfirmationTokenMock.mockResolvedValue(undefined);
    mintNewsletterUnsubscribeTokenMock.mockReturnValue(UNSUBSCRIBE_TOKEN);
    vi.mocked(getTenantBaseUrl).mockResolvedValue(SITE_URL);
  });

  it('emails the subscriber a confirm link and their own unsubscribe link', async () => {
    await sendNewsletterConfirmation(TENANT_ID, SUBSCRIBER);

    const { to, subject, replyTo, headers, html } = sentEmail();
    expect({ to, subject, replyTo, headers }).toEqual({
      to: SUBSCRIBER.email,
      subject: SUBJECT,
      replyTo: REPLY_TO,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
      },
    });
    expect(html).toContain(CONFIRM_URL);
    expect(mintNewsletterUnsubscribeTokenMock).toHaveBeenCalledWith(
      SUBSCRIBER.id,
    );
  });

  it('stores the new confirm token only once the email is sent', async () => {
    await sendNewsletterConfirmation(TENANT_ID, SUBSCRIBER);

    expect(commitConfirmationTokenMock).toHaveBeenCalledWith(
      SUBSCRIBER.id,
      CONFIRMATION_TOKEN,
    );
    expect(sendEmailMock.mock.invocationCallOrder[0]).toBeLessThan(
      commitConfirmationTokenMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('carries the language the reader subscribed in on both links', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce(LOCALE_ISO_CODES.FR);

    await sendNewsletterConfirmation(TENANT_ID, SUBSCRIBER);

    const { headers, html } = sentEmail();
    expect(html).toContain(`${CONFIRM_URL}&amp;lang=FR`);
    expect(headers['List-Unsubscribe']).toBe(`<${UNSUBSCRIBE_URL}&lang=FR>`);
  });

  it("renders the tenant's own brand and name", async () => {
    await sendNewsletterConfirmation(TENANT_ID, SUBSCRIBER);

    const { html } = sentEmail();
    expect(resolveTenantEmailIdentityMock).toHaveBeenCalledWith(TENANT_ID);
    expect(html).toContain(BRAND.logo1);
    expect(html).toContain(escapeHtml(BRAND_NAME));
  });

  it('sends nothing while the last confirmation is inside its cooldown', async () => {
    claimConfirmationSendMock.mockResolvedValue(null);

    await sendNewsletterConfirmation(TENANT_ID, SUBSCRIBER);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('gives back the cooldown and keeps the old token when the send fails', async () => {
    sendEmailMock.mockRejectedValue(SEND_ERROR);

    await expect(
      sendNewsletterConfirmation(TENANT_ID, SUBSCRIBER),
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
      sendNewsletterConfirmation(TENANT_ID, SUBSCRIBER),
    ).rejects.toBe(SEND_ERROR);
    expect(releaseConfirmationSendMock).toHaveBeenCalledWith(
      SUBSCRIBER.id,
      CLAIMED_AT,
    );
  });
});
