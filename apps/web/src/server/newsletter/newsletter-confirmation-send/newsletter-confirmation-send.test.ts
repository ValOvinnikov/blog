import {
  LOCALE_ISO_CODES,
  PRESET_ID,
  resolveTenantEmailBrand,
} from '@blog/config';
import { escapeHtml } from '@blog/email';
import { faker } from '@faker-js/faker';
import { setConfirmationEmailDefaults } from '@web/testing/server/newsletter/confirmation-email-defaults';
import { confirmationEmailEdges } from '@web/testing/server/newsletter/confirmation-email-edges';
import {
  firstSentEmail,
  MOCK_AUTHORED_SUBJECT,
  MOCK_CONFIRMATION_TOKEN,
  MOCK_REPLY_TO,
  MOCK_UNSUBSCRIBE_HEADERS,
  MOCK_UNSUBSCRIBE_TOKEN,
  MOCK_UNSUBSCRIBE_URL,
  mockEmailConfig,
} from '@web/testing/server/newsletter/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSubscriber } from '@web/testing/shared/subscriber/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
import { getLocale } from 'next-intl/server';

import { sendNewsletterConfirmation } from './newsletter-confirmation-send';

const { mintNewsletterUnsubscribeTokenMock } = vi.hoisted(() => ({
  mintNewsletterUnsubscribeTokenMock: vi.fn(),
}));

const {
  sendEmail: sendEmailMock,
  resolveTenantEmailIdentity: resolveTenantEmailIdentityMock,
  claimConfirmationSend: claimConfirmationSendMock,
  releaseConfirmationSend: releaseConfirmationSendMock,
  commitConfirmationToken: commitConfirmationTokenMock,
} = confirmationEmailEdges;

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: (
    await import('@web/testing/server/newsletter/confirmation-email-edges')
  ).confirmationEmailQueries(),
}));

vi.mock(import('@blog/email'), async (importOriginal) => ({
  ...(await importOriginal()),
  sendEmail: (
    await import('@web/testing/server/newsletter/confirmation-email-edges')
  ).confirmationEmailEdges.sendEmail,
}));

vi.mock('@web/utils/resolve-tenant-email-identity', async () => ({
  resolveTenantEmailIdentity: (
    await import('@web/testing/server/newsletter/confirmation-email-edges')
  ).confirmationEmailEdges.resolveTenantEmailIdentity,
}));

vi.mock(
  '@web/server/newsletter/newsletter-unsubscribe-token/newsletter-unsubscribe-token',
  () => ({
    mintNewsletterUnsubscribeToken: mintNewsletterUnsubscribeTokenMock,
  }),
);

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/utils/env/env', async () => ({
  env: (await import('@web/testing/server/newsletter/confirmation-email-edges'))
    .confirmationEmailEnv,
}));

const MOCK_BRAND_NAME = faker.company.name();
const MOCK_BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ max: 359 }),
});
const MOCK_CLAIMED_AT = faker.date.recent();
const MOCK_SUBSCRIBER = mockSubscriber();
const MOCK_CONFIRM_URL = `${MOCK_TENANT_BASE_URL}/api/newsletter/confirm?token=${MOCK_CONFIRMATION_TOKEN}`;

const sentEmail = () => firstSentEmail(sendEmailMock);

describe(sendNewsletterConfirmation, () => {
  beforeEach(() => {
    setConfirmationEmailDefaults({
      brand: MOCK_BRAND,
      brandName: MOCK_BRAND_NAME,
      emailConfig: mockEmailConfig({ replyToAddress: MOCK_REPLY_TO }),
      claim: {
        claimedAt: MOCK_CLAIMED_AT,
        confirmationToken: MOCK_CONFIRMATION_TOKEN,
      },
    });
    mintNewsletterUnsubscribeTokenMock.mockReturnValue(MOCK_UNSUBSCRIBE_TOKEN);
  });

  it('emails the subscriber a confirm link and their own unsubscribe link', async () => {
    await sendNewsletterConfirmation(MOCK_TENANT_ID, MOCK_SUBSCRIBER);

    const { to, subject, replyTo, headers, html } = sentEmail();
    expect({ to, subject, replyTo, headers }).toEqual({
      to: MOCK_SUBSCRIBER.email,
      subject: MOCK_AUTHORED_SUBJECT,
      replyTo: MOCK_REPLY_TO,
      headers: MOCK_UNSUBSCRIBE_HEADERS,
    });
    expect(html).toContain(MOCK_CONFIRM_URL);
    expect(mintNewsletterUnsubscribeTokenMock).toHaveBeenCalledWith(
      MOCK_SUBSCRIBER.id,
    );
  });

  it('stores the new confirm token only once the email is sent', async () => {
    await sendNewsletterConfirmation(MOCK_TENANT_ID, MOCK_SUBSCRIBER);

    expect(commitConfirmationTokenMock).toHaveBeenCalledWith(
      MOCK_SUBSCRIBER.id,
      MOCK_CONFIRMATION_TOKEN,
    );
    expect(sendEmailMock.mock.invocationCallOrder[0]).toBeLessThan(
      commitConfirmationTokenMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('carries the language the reader subscribed in on both links', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce(LOCALE_ISO_CODES.FR);

    await sendNewsletterConfirmation(MOCK_TENANT_ID, MOCK_SUBSCRIBER);

    const { headers, html } = sentEmail();
    expect(html).toContain(`${MOCK_CONFIRM_URL}&amp;lang=FR`);
    expect(headers).toEqual({
      ...MOCK_UNSUBSCRIBE_HEADERS,
      'List-Unsubscribe': `<${MOCK_UNSUBSCRIBE_URL}&lang=FR>`,
    });
  });

  it("renders the tenant's own brand and name", async () => {
    await sendNewsletterConfirmation(MOCK_TENANT_ID, MOCK_SUBSCRIBER);

    const { html } = sentEmail();
    expect(resolveTenantEmailIdentityMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(html).toContain(MOCK_BRAND.logo1);
    expect(html).toContain(escapeHtml(MOCK_BRAND_NAME));
  });

  it('sends nothing while the last confirmation is inside its cooldown', async () => {
    claimConfirmationSendMock.mockResolvedValue(null);

    await sendNewsletterConfirmation(MOCK_TENANT_ID, MOCK_SUBSCRIBER);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('gives back the cooldown and keeps the old token when the send fails', async () => {
    sendEmailMock.mockRejectedValue(MOCK_ERROR);

    await expect(
      sendNewsletterConfirmation(MOCK_TENANT_ID, MOCK_SUBSCRIBER),
    ).rejects.toBe(MOCK_ERROR);
    expect(releaseConfirmationSendMock).toHaveBeenCalledWith(
      MOCK_SUBSCRIBER.id,
      MOCK_CLAIMED_AT,
    );
    expect(commitConfirmationTokenMock).not.toHaveBeenCalled();
  });

  it('gives back the cooldown when storing the new token fails', async () => {
    commitConfirmationTokenMock.mockRejectedValue(MOCK_ERROR);

    await expect(
      sendNewsletterConfirmation(MOCK_TENANT_ID, MOCK_SUBSCRIBER),
    ).rejects.toBe(MOCK_ERROR);
    expect(releaseConfirmationSendMock).toHaveBeenCalledWith(
      MOCK_SUBSCRIBER.id,
      MOCK_CLAIMED_AT,
    );
  });
});
