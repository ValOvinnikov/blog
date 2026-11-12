import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { sendEmail } from '@blog/email';
import type * as BlogEmail from '@blog/email';
import { BILLING_LOG } from '@platform/constants/billing';
import enMessages from '@platform/i18n/messages/en.json';
import nlMessages from '@platform/i18n/messages/nl.json';
import {
  MOCK_INVOICE_PDF_URL,
  MOCK_STRIPE_INVOICE_ID,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_OWNER_EMAIL_FROM_ADDRESS } from '@platform/testing/owner-email/fixtures';
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

import { sendPaymentReceipt } from './send-payment-receipt';

const { getTenantByIdMock, getTenantOwnerEmailMock } = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
  getTenantOwnerEmailMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    memberships: { getTenantOwnerEmail: getTenantOwnerEmailMock },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof BlogEmail>()),
  sendEmail: vi.fn(),
}));

const retrieveInvoiceMock = vi.fn();
const stripe = {
  invoices: { retrieve: retrieveInvoiceMock },
} as unknown as Stripe;

const sendEmailMock = vi.mocked(sendEmail);
const sentEmail = () => sendEmailMock.mock.calls[0]?.[0];

const sendReceipt = () =>
  sendPaymentReceipt(
    stripe,
    MOCK_STRIPE_INVOICE_ID,
    MOCK_TENANT_ID,
    TENANT_PLAN.GROWTH,
  );

describe(sendPaymentReceipt, () => {
  beforeEach(() => {
    mockedEnv.OWNER_EMAIL_FROM_ADDRESS = MOCK_OWNER_EMAIL_FROM_ADDRESS;
    getTenantByIdMock.mockReset().mockResolvedValue(mockTenant());
    getTenantOwnerEmailMock.mockReset().mockResolvedValue(MOCK_OWNER_EMAIL);
    retrieveInvoiceMock.mockReset().mockResolvedValue(mockStripeInvoice());
    sendEmailMock.mockReset().mockResolvedValue(undefined);
    vi.mocked(logger.warn).mockReset();
  });

  describe('a paid invoice', () => {
    beforeEach(async () => {
      await sendReceipt();
    });

    it('emails the owner once from the owner-email address', () => {
      expect(sendEmailMock).toHaveBeenCalledOnce();
      expect(sentEmail()).toMatchObject({
        to: MOCK_OWNER_EMAIL,
        from: MOCK_OWNER_EMAIL_FROM_ADDRESS,
      });
    });

    it('re-reads the invoice from Stripe', () => {
      expect(retrieveInvoiceMock).toHaveBeenCalledWith(MOCK_STRIPE_INVOICE_ID);
    });

    it('carries the amount, the plan and a link to the invoice PDF', () => {
      const text = sentEmail()?.text;

      expect(text).toContain('$29.00');
      expect(text).toContain(enMessages.planNames.GROWTH);
      expect(text).toContain(MOCK_INVOICE_PDF_URL);
      expect(text).toContain(MOCK_TENANT_NAME);
    });
  });

  it("writes in the site's default language", async () => {
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ locale: LOCALE_ISO_CODES.NL }),
    );

    await sendReceipt();

    expect(sentEmail()?.text).toContain(
      nlMessages.ownerReceiptEmail.actionLabel,
    );
  });

  it('sends nothing for an invoice that charged nothing', async () => {
    retrieveInvoiceMock.mockResolvedValue(
      mockStripeInvoice({ amount_paid: 0 }),
    );

    await sendReceipt();

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('skips and logs without a sender address', async () => {
    mockedEnv.OWNER_EMAIL_FROM_ADDRESS = undefined;

    await sendReceipt();

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(BILLING_LOG.RECEIPT_UNCONFIGURED, {
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('skips and logs without an owner address', async () => {
    getTenantOwnerEmailMock.mockResolvedValue(undefined);

    await sendReceipt();

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      BILLING_LOG.RECEIPT_OWNER_MISSING,
      { tenantId: MOCK_TENANT_ID },
    );
  });
});
