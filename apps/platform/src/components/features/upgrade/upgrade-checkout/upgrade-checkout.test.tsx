import { ACTION_OUTCOME } from '@blog/config';
import { BILLING_INTERVAL, UPGRADE_REFUSAL } from '@platform/constants/billing';
import messages from '@platform/i18n/messages/en.json';
import { createUpgradeCheckoutAction } from '@platform/server/billing/create-upgrade-checkout-action';
import {
  MOCK_STRIPE_PROMOTION_CODE,
  MOCK_STRIPE_PUBLISHABLE_KEY,
} from '@platform/testing/billing/fixtures';
import { EMBEDDED_CHECKOUT_TEST_ID } from '@platform/testing/billing/stripe-react-fake';
import { act, customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { loadStripe } from '@stripe/stripe-js';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { UpgradeCheckout } from './upgrade-checkout';

vi.mock('@stripe/stripe-js');

vi.mock('@stripe/react-stripe-js');

vi.mock('@platform/server/billing/create-upgrade-checkout-action');

const { upgradePage } = messages;
const createCheckoutMock = vi.mocked(createUpgradeCheckoutAction);
const MOCK_YEARLY_REQUEST = {
  interval: BILLING_INTERVAL.YEARLY,
  promo: MOCK_STRIPE_PROMOTION_CODE,
};

const setup = customRender(UpgradeCheckout, {
  tenantId: MOCK_TENANT_ID,
  publishableKey: MOCK_STRIPE_PUBLISHABLE_KEY,
  promo: MOCK_STRIPE_PROMOTION_CODE,
});

describe(`<${UpgradeCheckout.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
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

      expect(createCheckoutMock).toHaveBeenLastCalledWith(
        MOCK_TENANT_ID,
        MOCK_YEARLY_REQUEST,
      );
    });
  });

  it('says why checkout was refused and offers no retry', async () => {
    createCheckoutMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPGRADE_REFUSAL.SUBSCRIBED,
    });
    setup();

    const notice = await screen.findByText(upgradePage.SUBSCRIBED);
    const retry = screen.queryByRole('button', { name: upgradePage.tryAgain });

    expect(notice).toBeVisible();
    expect(retry).not.toBeInTheDocument();
  });

  describe('when checkout fails to start', () => {
    beforeEach(async () => {
      createCheckoutMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      await act(async () => {
        setup();
      });
    });

    it('says checkout could not start', async () => {
      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent(upgradePage.checkoutFailed);
    });

    it('opens checkout again for the same period from Try again', async () => {
      const retry = await screen.findByRole('button', {
        name: upgradePage.tryAgain,
      });

      await user.click(retry);

      const checkout = await screen.findByTestId(EMBEDDED_CHECKOUT_TEST_ID);
      expect(checkout).toBeInTheDocument();
      expect(createCheckoutMock).toHaveBeenLastCalledWith(MOCK_TENANT_ID, {
        interval: BILLING_INTERVAL.MONTHLY,
        promo: MOCK_STRIPE_PROMOTION_CODE,
      });
    });
  });
});
