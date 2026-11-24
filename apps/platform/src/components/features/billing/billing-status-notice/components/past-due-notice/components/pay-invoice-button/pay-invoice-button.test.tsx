import en from '@platform/i18n/messages/en.json';
import { payOpenInvoiceAction } from '@platform/server/billing/pay-open-invoice-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { PayInvoiceButton } from './pay-invoice-button';

vi.mock('@platform/server/billing/pay-open-invoice-action');

const { pastDueAction, pastDueActionFailed } = en.billingStatusNotice;

const payOpenInvoiceActionMock = vi.mocked(payOpenInvoiceAction);

const setup = customRender(PayInvoiceButton, { tenantId: MOCK_TENANT_ID });

const clickPay = async () => {
  const user = userEvent.setup();
  setup();
  const button = screen.getByRole('button', { name: pastDueAction });
  await user.click(button);
};

describe(`<${PayInvoiceButton.name}/>`, () => {
  it("opens the payment page for the owner's site", async () => {
    payOpenInvoiceActionMock.mockReturnValueOnce(new Promise(() => {}));

    await clickPay();

    expect(payOpenInvoiceActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('says so when the payment page cannot be opened', async () => {
    await clickPay();

    const message = await screen.findByText(pastDueActionFailed);
    expect(message).toBeVisible();
  });
});
