import en from '@platform/i18n/messages/en.json';
import { payOpenInvoiceAction } from '@platform/server/billing/pay-open-invoice-action';
import { MOCK_HOSTED_INVOICE_URL } from '@platform/testing/billing/fixtures';
import { PAY_INVOICE_BUTTON_NAME } from '@platform/testing/billing/pay-invoice-button';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent from '@testing-library/user-event';

import { PayInvoiceButton } from './pay-invoice-button';

vi.mock('@platform/server/billing/pay-open-invoice-action');

const { pastDueActionFailed } = en.billingStatusNotice;

const payOpenInvoiceActionMock = vi.mocked(payOpenInvoiceAction);

const setup = customRender(PayInvoiceButton, { tenantId: MOCK_TENANT_ID });

const mockPaymentTab = () => {
  const paymentTab = {
    opener: window,
    close: vi.fn(),
    location: { assign: vi.fn() },
  };
  const open = vi
    .spyOn(window, 'open')
    .mockReturnValue(paymentTab as unknown as Window);
  return { paymentTab, open };
};

const clickPay = async () => {
  const user = userEvent.setup();
  setup();
  const button = screen.getByRole('button', { name: PAY_INVOICE_BUTTON_NAME });
  await user.click(button);
};

describe(`<${PayInvoiceButton.name}/>`, () => {
  it("opens the owner's payment page in a new tab", async () => {
    const { paymentTab, open } = mockPaymentTab();
    payOpenInvoiceActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: MOCK_HOSTED_INVOICE_URL,
    });

    await clickPay();

    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(payOpenInvoiceActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    await waitFor(() => {
      expect(paymentTab.location.assign).toHaveBeenCalledWith(
        new URL(MOCK_HOSTED_INVOICE_URL).toString(),
      );
    });
    expect(paymentTab.opener).toBeNull();
  });

  it('closes the new tab and says so when the payment page cannot be opened', async () => {
    const { paymentTab } = mockPaymentTab();
    payOpenInvoiceActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await clickPay();

    const message = await screen.findByText(pastDueActionFailed);
    expect(message).toBeVisible();
    expect(paymentTab.close).toHaveBeenCalled();
    expect(paymentTab.location.assign).not.toHaveBeenCalled();
  });
});
