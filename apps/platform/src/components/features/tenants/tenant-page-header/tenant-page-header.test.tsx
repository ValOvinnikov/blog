import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  mockTenant,
  MOCK_CUSTOM_DOMAIN,
  MOCK_CUSTOM_DOMAIN_URL,
  MOCK_SITE_NAME,
} from '@platform/testing/tenants/fixtures';

import { TenantPageHeader } from './tenant-page-header';

const TITLE_ROW_TEST_ID = 'page-header-title-row';
const ACTIVE_LABEL = 'Active';
const GROWTH_LABEL = 'Growth';

const setup = customRender(TenantPageHeader, {
  tenant: mockTenant({
    name: MOCK_SITE_NAME,
    primaryDomain: MOCK_CUSTOM_DOMAIN,
    status: TENANT_STATUS.ACTIVE,
    plan: TENANT_PLAN.GROWTH,
  }),
});

describe(`<${TenantPageHeader.name}/>`, () => {
  it('shows the name, status and plan pills and an Open site link by default', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_SITE_NAME,
    });
    const titleRow = screen.getByTestId(TITLE_ROW_TEST_ID);
    const status = within(titleRow).getByText(ACTIVE_LABEL);
    const plan = within(titleRow).getByText(GROWTH_LABEL);
    const openSite = screen.getByRole('link', {
      name: 'Open site (opens in new tab)',
    });

    expect(heading).toBeVisible();
    expect(status).toBeVisible();
    expect(plan).toBeVisible();
    expect(openSite).toHaveAttribute('href', MOCK_CUSTOM_DOMAIN_URL);
  });

  it('hides the plan pill but keeps the status pill when it has no plan badge', () => {
    setup({ hasPlanBadge: false });

    const titleRow = screen.getByTestId(TITLE_ROW_TEST_ID);
    const status = within(titleRow).getByText(ACTIVE_LABEL);
    const plan = within(titleRow).queryByText(GROWTH_LABEL);

    expect(status).toBeVisible();
    expect(plan).not.toBeInTheDocument();
  });
});
