import { ACTION_OUTCOME } from '@blog/config';
import { BILLING_INTERVAL, UPGRADE_STATE } from '@platform/constants/billing';
import messages from '@platform/i18n/messages/en.json';
import { createUpgradeCheckoutAction } from '@platform/server/billing/create-upgrade-checkout-action';
import {
  MOCK_CHECKOUT_CLIENT_SECRET,
  MOCK_STRIPE_PROMOTION_CODE,
  MOCK_STRIPE_PUBLISHABLE_KEY,
} from '@platform/testing/billing/fixtures';
import { EMBEDDED_CHECKOUT_TEST_ID } from '@platform/testing/billing/stripe-react-fake';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { loadStripe } from '@stripe/stripe-js';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { UpgradeCheckout } from './upgrade-checkout';

vi.mock('@stripe/stripe-js');

vi.mock('@stripe/react-stripe-js');

vi.mock('@platform/server/billing/create-upgrade-checkout-action');

const { upgradePage } = messages;
const createCheckoutMock = vi.mocked(createUpgradeCheckoutAction);

const setup = customRender(UpgradeCheckout, {
  tenantId: MOCK_TENANT_ID,
  publishableKey: MOCK_STRIPE_PUBLISHABLE_KEY,
  promo: MOCK_STRIPE_PROMOTION_CODE,
});

describe(`<${UpgradeCheckout.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    createCheckoutMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      clientSecret: MOCK_CHECKOUT_CLIENT_SECRET,
    });
  });

  describe('when checkout starts', () => {
    beforeEach(() => {
      setup();
    });

    it('loads Stripe with the publishable key and opens a monthly checkout', async () => {
      const checkout = await screen.findByTestId(EMBEDDED_CHECKOUT_TEST_ID);

      expect(checkout).toBeInTheDocument();
      expect(loadStripe).toHaveBeenCalledWith(MOCK_STRIPE_PUBLISHABLE_KEY);
      expect(createCheckoutMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        interval: BILLING_INTERVAL.MONTHLY,
        promo: MOCK_STRIPE_PROMOTION_CODE,
      });
    });

    it('opens a yearly checkout when Yearly is chosen', async () => {
      const yearly = screen.getByRole('button', { name: upgradePage.YEARLY });

      await user.click(yearly);

      expect(createCheckoutMock).toHaveBeenLastCalledWith(MOCK_TENANT_ID, {
        interval: BILLING_INTERVAL.YEARLY,
        promo: MOCK_STRIPE_PROMOTION_CODE,
      });
    });
  });

  it('says why checkout was refused', async () => {
    createCheckoutMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPGRADE_STATE.PAID_PLAN,
    });
    setup();

    const notice = await screen.findByText(upgradePage.PAID_PLAN);

    expect(notice).toBeVisible();
  });

  it('says checkout could not start after a failure', async () => {
    createCheckoutMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(upgradePage.checkoutFailed);
  });
});
