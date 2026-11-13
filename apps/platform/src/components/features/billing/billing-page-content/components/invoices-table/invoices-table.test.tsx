import { STRIPE_INVOICE_STATUS } from '@platform/constants/billing';
import type { TBillingInvoice } from '@platform/server/billing/fetch-stripe-billing';
import {
  MOCK_INVOICE_PDF_URL,
  MOCK_STRIPE_INVOICE_ID,
} from '@platform/testing/billing/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';

import { InvoicesTable } from './invoices-table';

const MOCK_INVOICE: TBillingInvoice = {
  id: MOCK_STRIPE_INVOICE_ID,
  issuedAt: new Date('2026-10-02T00:00:00.000Z'),
  amount: { minorUnits: 2900, currency: 'eur' },
  status: STRIPE_INVOICE_STATUS.PAID,
  url: MOCK_INVOICE_PDF_URL,
};

const setup = customRender(InvoicesTable, { invoices: [MOCK_INVOICE] });

describe(`<${InvoicesTable.name}/>`, () => {
  describe('an invoice with a PDF', () => {
    beforeEach(() => {
      setup();
    });

    it("lists the invoice's date, amount and status", () => {
      const [, row] = screen.getAllByRole('row');

      expect(row).toHaveTextContent('Oct 2, 2026');
      expect(row).toHaveTextContent('€29.00');
      expect(row).toHaveTextContent('Paid');
    });

    it("links the invoice's PDF", () => {
      const link = screen.getByRole('link', {
        name: /View the invoice from Oct 2, 2026/,
      });

      expect(link).toHaveAttribute('href', MOCK_INVOICE_PDF_URL);
    });
  });

  it('offers no link for an invoice without one', () => {
    setup({ invoices: [{ ...MOCK_INVOICE, url: undefined }] });

    const link = screen.queryByRole('link');

    expect(link).not.toBeInTheDocument();
  });

  it('says there are no invoices yet', () => {
    setup({ invoices: [] });

    const empty = screen.getByText('No invoices yet.');

    expect(empty).toBeVisible();
  });
});
