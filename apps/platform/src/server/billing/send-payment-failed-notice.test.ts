import { BILLING_LOG } from '@platform/constants/billing';
import { PAYMENT_FAILURE } from '@platform/constants/stripe-payment';
import enMessages from '@platform/i18n/messages/en.json';
import nlMessages from '@platform/i18n/messages/nl.json';
import { toStripeTime } from '@platform/server/billing/stripe-time';
import {
  MOCK_AMOUNT_PAID_TEXT,
  MOCK_HOSTED_INVOICE_URL,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import {
  MOCK_OWNER_EMAIL_FROM_ADDRESS,
  MOCK_PLATFORM_APP_BASE_URL,
} from '@platform/testing/owner-email/fixtures';
import {
  getTenantByIdMock,
  getTenantOwnerEmailMock,
  mockOwnerEmailDb,
} from '@platform/testing/owner-email/mock-owner-email-db';
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { LOCALE_ISO_CODES, type TMaybeUndefined } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import type { TValueOf } from '@shinefold/config/utils';
import { sendEmail } from '@shinefold/email';
import type Stripe from 'stripe';

import { sendPaymentFailedNotice } from './send-payment-failed-notice';

vi.mock('@platform/utils/env/env');

vi.mock('@shinefold/db', () => mockOwnerEmailDb());

vi.mock('@shinefold/email');

const MOCK_NEXT_PAYMENT_ATTEMPT = toStripeTime(new Date());
const copy = enMessages.ownerPaymentFailedEmail;

const sendEmailMock = vi.mocked(sendEmail);
const sentText = () => sendEmailMock.mock.calls[0]?.[0].text;

const sendNotice = (
  invoice: Stripe.Invoice = mockStripeInvoice(),
  failure: TValueOf<typeof PAYMENT_FAILURE> = PAYMENT_FAILURE.DECLINED,
) =>
  sendPaymentFailedNotice(invoice, MOCK_TENANT_ID, TENANT_PLAN.GROWTH, failure);

describe(sendPaymentFailedNotice, () => {
  beforeEach(() => {
    mockedEnv.OWNER_EMAIL_FROM_ADDRESS = MOCK_OWNER_EMAIL_FROM_ADDRESS;
    mockedEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
    getTenantByIdMock.mockResolvedValue(mockTenant());
    getTenantOwnerEmailMock.mockResolvedValue(MOCK_OWNER_EMAIL);
  });

  describe('an invoice Stripe will retry', () => {
    let text: TMaybeUndefined<string>;

    beforeEach(async () => {
      await sendNotice(
        mockStripeInvoice({
          next_payment_attempt: MOCK_NEXT_PAYMENT_ATTEMPT,
          hosted_invoice_url: MOCK_HOSTED_INVOICE_URL,
        }),
      );
      text = sentText();
    });

    it('emails the owner once from the owner-email address', () => {
      expect(sendEmailMock).toHaveBeenCalledOnce();
      expect(sendEmailMock.mock.calls[0]?.[0]).toMatchObject({
        to: MOCK_OWNER_EMAIL,
        from: MOCK_OWNER_EMAIL_FROM_ADDRESS,
      });
    });

    it('carries the amount due, the plan and the site', () => {
      expect(text).toContain(MOCK_AMOUNT_PAID_TEXT);
      expect(text).toContain(enMessages.planNames.GROWTH);
      expect(text).toContain(MOCK_TENANT_NAME);
    });

    it("links to the invoice's payment page", () => {
      expect(text).toContain(MOCK_HOSTED_INVOICE_URL);
      expect(text).not.toContain(adminRoutes.dashboardBilling());
    });

    it('gives the next attempt and no plan-ending notice', () => {
      expect(text).toContain(copy.nextRetryLabel);
      expect(text).not.toContain(copy.planEnding);
    });
  });

  describe('an invoice Stripe will not retry, with no payment page', () => {
    let text: TMaybeUndefined<string>;

    beforeEach(async () => {
      await sendNotice();
      text = sentText();
    });

    it('says the plan ends', () => {
      expect(text).toContain(copy.planEnding);
      expect(text).not.toContain(copy.nextRetryLabel);
    });

    it('links to the Billing page', () => {
      expect(text).toContain(
        new URL(adminRoutes.dashboardBilling(), MOCK_PLATFORM_APP_BASE_URL)
          .href,
      );
    });
  });

  describe("a payment waiting on the bank's check", () => {
    let text: TMaybeUndefined<string>;

    beforeEach(async () => {
      await sendNotice(
        mockStripeInvoice({ hosted_invoice_url: MOCK_HOSTED_INVOICE_URL }),
        PAYMENT_FAILURE.AUTHENTICATION_REQUIRED,
      );
      text = sentText();
    });

    it('asks the owner to confirm the payment with their bank', () => {
      expect(sendEmailMock.mock.calls[0]?.[0].subject).toBe(
        `Confirm your payment for ${MOCK_TENANT_NAME}`,
      );
      expect(text).toContain(copy.confirmPayment);
      expect(text).toContain(copy.confirmActionLabel);
      expect(text).not.toContain(copy.payInvoice);
    });

    it('links to the page where the bank check is completed', () => {
      expect(text).toContain(MOCK_HOSTED_INVOICE_URL);
    });
  });

  it("writes in the site's default language", async () => {
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ locale: LOCALE_ISO_CODES.NL }),
    );

    await sendNotice();

    expect(sentText()).toContain(
      nlMessages.ownerPaymentFailedEmail.actionLabel,
    );
  });

  it.each([
    ['a sender address', 'OWNER_EMAIL_FROM_ADDRESS'],
    ['a platform URL', 'PLATFORM_APP_BASE_URL'],
  ] as const)('skips and logs without %s', async (_, key) => {
    mockedEnv[key] = undefined;

    await sendNotice();

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      BILLING_LOG.PAYMENT_FAILED_EMAIL_UNCONFIGURED,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('skips and logs without an owner address', async () => {
    getTenantOwnerEmailMock.mockResolvedValue(undefined);

    await sendNotice();

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      BILLING_LOG.PAYMENT_FAILED_EMAIL_OWNER_MISSING,
      { tenantId: MOCK_TENANT_ID },
    );
  });
});
