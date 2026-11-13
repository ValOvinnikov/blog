import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { BILLING_LOG } from '@platform/constants/billing';
import messages from '@platform/i18n/messages/en.json';
import {
  MOCK_STRIPE_PUBLISHABLE_KEY,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import { EMBEDDED_CHECKOUT_TEST_ID } from '@platform/testing/billing/stripe-react-fake';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockedStripeEnv } from '@platform/testing/env/mocked-stripe-env';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';

import { UpgradePageContent } from './upgrade-page-content';

vi.mock('@platform/utils/stripe-env/stripe-env');

vi.mock('@stripe/stripe-js');

vi.mock('@stripe/react-stripe-js');

vi.mock('@platform/server/billing/create-upgrade-checkout-action');

vi.mock('@platform/server/billing/get-upgrade-state-action');

const { upgradePage, planNames } = messages;
const t = makeEnTranslator('upgradePage');

const setup = customRenderAsync(UpgradePageContent, {
  tenant: mockTenant(),
  membership: mockMembership(),
  isReturning: false,
});

const MOCK_SUBSCRIBED_TENANT = mockTenant({
  plan: TENANT_PLAN.STARTER,
  stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
});

describe(`<${UpgradePageContent.name}/>`, () => {
  beforeEach(() => {
    mockedStripeEnv.STRIPE_PUBLISHABLE_KEY = MOCK_STRIPE_PUBLISHABLE_KEY;
  });

  it('opens checkout for the owner of a Free site', async () => {
    await setup();

    const title = screen.getByRole('heading', {
      level: 1,
      name: upgradePage.pageTitle,
    });
    const checkout = await screen.findByTestId(EMBEDDED_CHECKOUT_TEST_ID);

    expect(title).toBeVisible();
    expect(checkout).toBeInTheDocument();
  });

  it('says upgrading is unavailable and logs without a publishable key', async () => {
    mockedStripeEnv.STRIPE_PUBLISHABLE_KEY = undefined;

    await setup();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(upgradePage.unconfigured);
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.CHECKOUT_UNCONFIGURED,
      { tenantId: MOCK_TENANT_ID, hasPublishableKey: false },
    );
  });

  it.each([false, true])(
    'shows a paying site its plan with a way back (returning: %s)',
    async (isReturning) => {
      await setup({ tenant: MOCK_SUBSCRIBED_TENANT, isReturning });

      const title = screen.getByText(
        t('subscribedTitle', { plan: planNames.STARTER }),
      );
      const back = screen.getByRole('link', {
        name: upgradePage.backToOverview,
      });

      expect(title).toBeVisible();
      expect(back).toHaveAttribute('href', adminRoutes.dashboard());
    },
  );

  it('confirms the payment after checkout until the subscription is live', async () => {
    await setup({ isReturning: true });

    const confirming = screen.getByText(upgradePage.confirmingTitle);
    const checkout = screen.queryByTestId(EMBEDDED_CHECKOUT_TEST_ID);

    expect(confirming).toBeVisible();
    expect(checkout).not.toBeInTheDocument();
  });

  it('explains why a member who is not the owner cannot upgrade', async () => {
    await setup({
      membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    });

    const note = screen.getByRole('note');
    const checkout = screen.queryByTestId(EMBEDDED_CHECKOUT_TEST_ID);

    expect(note).toHaveTextContent(upgradePage.NOT_OWNER);
    expect(checkout).not.toBeInTheDocument();
  });
});
