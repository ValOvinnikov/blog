import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import { BILLING_LOG } from '@platform/constants/billing';
import messages from '@platform/i18n/messages/en.json';
import { MOCK_STRIPE_PUBLISHABLE_KEY } from '@platform/testing/billing/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';

import { UpgradePageContent } from './upgrade-page-content';

vi.mock('@platform/utils/stripe-env/stripe-env', () => ({ stripeEnv: {} }));

vi.mock('@stripe/stripe-js');

vi.mock('@stripe/react-stripe-js');

vi.mock('@platform/server/billing/create-upgrade-checkout-action');

vi.mock('@platform/server/billing/get-upgrade-state-action');

const { upgradePage } = messages;
const mockedStripeEnv: Partial<Record<keyof typeof stripeEnv, string>> =
  stripeEnv;

const setup = customRenderAsync(UpgradePageContent, {
  tenant: mockTenant(),
  membership: mockMembership(),
  isReturning: false,
});

const GROWTH_TENANT = mockTenant({ plan: TENANT_PLAN.GROWTH });

describe(`<${UpgradePageContent.name}/>`, () => {
  beforeEach(() => {
    mockedStripeEnv.STRIPE_PUBLISHABLE_KEY = MOCK_STRIPE_PUBLISHABLE_KEY;
  });

  it('offers checkout to the owner of a Free site', async () => {
    await setup();

    const title = screen.getByRole('heading', {
      level: 1,
      name: upgradePage.pageTitle,
    });
    const checkout = screen.getByRole('heading', {
      level: 2,
      name: upgradePage.checkoutTitle,
    });

    expect(title).toBeVisible();
    expect(checkout).toBeVisible();
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
    'shows a site on Growth its plan with a way back (returning: %s)',
    async (isReturning) => {
      await setup({ tenant: GROWTH_TENANT, isReturning });

      const title = screen.getByText(upgradePage.onGrowthTitle);
      const back = screen.getByRole('link', {
        name: upgradePage.backToOverview,
      });

      expect(title).toBeVisible();
      expect(back).toHaveAttribute('href', adminRoutes.dashboard());
    },
  );

  it('confirms the payment after checkout until the site is on Growth', async () => {
    await setup({ isReturning: true });

    const confirming = screen.getByText(upgradePage.confirmingTitle);
    const checkout = screen.queryByRole('heading', {
      name: upgradePage.checkoutTitle,
    });

    expect(confirming).toBeVisible();
    expect(checkout).not.toBeInTheDocument();
  });

  it.each([
    [
      upgradePage.NOT_OWNER,
      { membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }) },
    ],
    [
      upgradePage.PAID_PLAN,
      { tenant: mockTenant({ plan: TENANT_PLAN.STARTER }) },
    ],
    [
      upgradePage.UNAVAILABLE,
      { tenant: mockTenant({ status: TENANT_STATUS.SUSPENDED }) },
    ],
  ])('explains "%s" and offers no checkout', async (copy, overrides) => {
    await setup(overrides);

    const note = screen.getByRole('note');
    const checkout = screen.queryByRole('heading', {
      name: upgradePage.checkoutTitle,
    });

    expect(note).toHaveTextContent(copy);
    expect(checkout).not.toBeInTheDocument();
  });
});
