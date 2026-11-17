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
const MANAGE_BILLING = makeEnTranslator('billingPage')('manage');

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

  it('offers the owner Manage billing', async () => {
    await setup();

    const manageBilling = screen.getByRole('button', { name: MANAGE_BILLING });

    expect(manageBilling).toBeVisible();
  });

  it('shows a super admin no Manage billing', async () => {
    await setup({
      viewer: mockViewer({ admin: mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }) }),
    });

    const manageBilling = screen.queryByRole('button', {
      name: MANAGE_BILLING,
    });

    expect(manageBilling).not.toBeInTheDocument();
  });

  it('shows the owner no Manage billing before the site has a billing account', async () => {
    getTenantBillingMock.mockResolvedValue(MOCK_EMPTY_TENANT_BILLING);

    await setup();

    const manageBilling = screen.queryByRole('button', {
      name: MANAGE_BILLING,
    });

    expect(manageBilling).not.toBeInTheDocument();
  });
});
