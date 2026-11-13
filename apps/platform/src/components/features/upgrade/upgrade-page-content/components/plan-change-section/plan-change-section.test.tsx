import { TENANT_PLAN } from '@blog/config/constants';
import { BILLING_INTERVAL } from '@platform/constants/billing';
import messages from '@platform/i18n/messages/en.json';
import type { TSubscriptionPlan } from '@platform/server/billing/load-subscription-plan';
import { readTenantSubscriptionPlan } from '@platform/server/billing/read-tenant-subscription-plan';
import {
  MOCK_STRIPE_CLIENT,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import {
  MOCK_PLAN_ITEM_ID,
  MOCK_RENEWS_AT,
} from '@platform/testing/billing/plan-subscription';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { PlanChangeSection } from './plan-change-section';

vi.mock('@platform/i18n/navigation');

vi.mock('@platform/server/billing/change-plan-action');

vi.mock('@platform/server/billing/get-tenant-plan-action');

vi.mock('@platform/server/billing/read-tenant-subscription-plan', () => ({
  readTenantSubscriptionPlan: vi.fn(),
}));

const { upgradePage, planNames } = messages;
const t = makeEnTranslator('upgradePage');

const MOCK_SUBSCRIPTION: TSubscriptionPlan = {
  id: MOCK_STRIPE_SUBSCRIPTION_ID,
  current: {
    plan: TENANT_PLAN.GROWTH,
    interval: BILLING_INTERVAL.YEARLY,
    ceiling: null,
  },
  isChangeable: true,
  renewsAt: MOCK_RENEWS_AT,
  scheduleId: undefined,
  pending: undefined,
  planItemId: MOCK_PLAN_ITEM_ID,
  bandItem: undefined,
};

const withSubscription = (overrides: Partial<TSubscriptionPlan> = {}) =>
  vi.mocked(readTenantSubscriptionPlan).mockResolvedValueOnce({
    stripe: MOCK_STRIPE_CLIENT,
    subscription: { ...MOCK_SUBSCRIPTION, ...overrides },
  });

const setup = customRenderAsync(PlanChangeSection, {
  tenantId: MOCK_TENANT_ID,
  subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
});

describe(`<${PlanChangeSection.name}/>`, () => {
  it('offers a plan change from the plan Stripe reports', async () => {
    withSubscription();

    await setup();
    const current = screen.getByText(
      t('currentPlan', {
        plan: planNames.GROWTH,
        interval: BILLING_INTERVAL.YEARLY,
      }),
    );

    expect(current).toBeVisible();
  });

  it('sends a subscription that needs attention to Billing', async () => {
    withSubscription({ isChangeable: false });

    await setup();
    const note = screen.getByRole('note');
    const billing = screen.getByRole('link', { name: upgradePage.billingLink });

    expect(note).toHaveTextContent(upgradePage.NOT_ACTIVE);
    expect(billing).toHaveAttribute('href', adminRoutes.dashboardBilling());
  });

  it('says the plan could not be loaded', async () => {
    vi.mocked(readTenantSubscriptionPlan).mockResolvedValueOnce(undefined);

    await setup();
    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent(upgradePage.planLoadFailed);
  });
});
