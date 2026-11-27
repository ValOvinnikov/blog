import { BILLING_OVERVIEW_STATE } from '@platform/constants/billing';
import { loadBillingOverview } from '@platform/server/billing/load-billing-overview';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_PAYING_TENANT_BILLING } from '@platform/testing/billing/overview';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockViewer } from '@platform/testing/memberships/fixtures';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';
import { queries } from '@shinefold/db';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import { MOCK_EMPTY_TENANT_BILLING } from '@shinefold/db/testing/tenants/billing';

import { BillingPageContent } from './billing-page-content';

vi.mock('@platform/server/billing/load-billing-overview', () => ({
  loadBillingOverview: vi.fn(),
}));

vi.mock('@shinefold/db', () => ({
  queries: { tenants: { getTenantBilling: vi.fn() } },
}));

const getTenantBillingMock = vi.mocked(queries.tenants.getTenantBilling);
const billingPage = makeEnTranslator('billingPage');
const MANAGE_BILLING = billingPage('manage');
const PLAN_CHANGE_LINK = new RegExp(
  `^(${billingPage('upgrade')}|${billingPage('changePlan')})$`,
);

const setup = customRenderAsync(BillingPageContent, {
  tenant: mockReadyTenant(),
  viewer: mockViewer(),
});

describe(`<${BillingPageContent.name}/>`, () => {
  beforeEach(() => {
    getTenantBillingMock.mockResolvedValue(MOCK_PAYING_TENANT_BILLING);
    vi.mocked(loadBillingOverview).mockResolvedValue({
      state: BILLING_OVERVIEW_STATE.NO_CUSTOMER,
    });
  });

  describe('the owner on the dashboard', () => {
    beforeEach(async () => {
      await setup();
    });

    it('offers Manage billing', () => {
      const manageBilling = screen.getByRole('button', {
        name: MANAGE_BILLING,
      });

      expect(manageBilling).toBeVisible();
    });

    it('offers a plan change', () => {
      const planChange = screen.getByRole('link', { name: PLAN_CHANGE_LINK });

      expect(planChange).toBeVisible();
    });

    it('describes the page to the owner', () => {
      const description = screen.getByText(billingPage('description'));

      expect(description).toBeVisible();
    });
  });

  describe('a super admin on the dashboard', () => {
    beforeEach(async () => {
      await setup({
        viewer: mockViewer({
          admin: mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
        }),
      });
    });

    it('shows no Manage billing', () => {
      const manageBilling = screen.queryByRole('button', {
        name: MANAGE_BILLING,
      });

      expect(manageBilling).not.toBeInTheDocument();
    });

    it('shows no plan change', () => {
      const planChange = screen.queryByRole('link', { name: PLAN_CHANGE_LINK });

      expect(planChange).not.toBeInTheDocument();
    });
  });

  it('shows the owner no Manage billing before the site has a billing account', async () => {
    getTenantBillingMock.mockResolvedValue(MOCK_EMPTY_TENANT_BILLING);

    await setup();

    const manageBilling = screen.queryByRole('button', {
      name: MANAGE_BILLING,
    });

    expect(manageBilling).not.toBeInTheDocument();
  });

  describe('read-only for the operator', () => {
    beforeEach(async () => {
      await setup({ isReadOnly: true });
    });

    it('shows even the owner no Manage billing', () => {
      const manageBilling = screen.queryByRole('button', {
        name: MANAGE_BILLING,
      });

      expect(manageBilling).not.toBeInTheDocument();
    });

    it('shows even the owner no plan change', () => {
      const planChange = screen.queryByRole('link', { name: PLAN_CHANGE_LINK });

      expect(planChange).not.toBeInTheDocument();
    });

    it('describes the page for the operator', () => {
      const operatorDescription = screen.getByText(
        billingPage('operatorDescription'),
      );
      const ownerDescription = screen.queryByText(billingPage('description'));

      expect(operatorDescription).toBeVisible();
      expect(ownerDescription).not.toBeInTheDocument();
    });
  });
});
