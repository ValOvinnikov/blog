import { ACTION_OUTCOME } from '@blog/config';
import { BILLING_REFUSAL } from '@platform/constants/billing';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { ManageBillingButton } from './manage-billing-button';

const { openBillingPortalActionMock } = vi.hoisted(() => ({
  openBillingPortalActionMock: vi.fn(),
}));

vi.mock('@platform/server/billing/open-billing-portal-action', () => ({
  openBillingPortalAction: openBillingPortalActionMock,
}));

const MANAGE_BILLING = { name: 'Manage billing' };

const setup = customRender(ManageBillingButton, { tenantId: MOCK_TENANT_ID });

const clickManageBilling = async () => {
  const user = userEvent.setup();
  setup();
  const button = screen.getByRole('button', MANAGE_BILLING);
  await user.click(button);
};

describe(`<${ManageBillingButton.name}/>`, () => {
  beforeEach(() => {
    openBillingPortalActionMock.mockReset();
  });

  it("opens billing for the owner's site", async () => {
    openBillingPortalActionMock.mockReturnValue(new Promise(() => {}));

    await clickManageBilling();

    expect(openBillingPortalActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('says so when the site has no billing account', async () => {
    openBillingPortalActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: BILLING_REFUSAL.NO_CUSTOMER,
    });

    await clickManageBilling();

    const message = await screen.findByText(
      'Your site has no billing account yet.',
    );
    expect(message).toBeVisible();
  });

  it('says so when billing cannot be opened', async () => {
    openBillingPortalActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await clickManageBilling();

    const message = await screen.findByText(
      "Billing couldn't be opened. Try again in a moment.",
    );
    expect(message).toBeVisible();
  });
});
