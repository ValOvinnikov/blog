import { mockAuditEvent } from '@platform/testing/audit-events/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { RecentActivityCard } from './recent-activity-card';

const setup = customRender(RecentActivityCard, {
  events: [mockAuditEvent()],
  viewAllHref: adminRoutes.tenantActivity(MOCK_TENANT_ID),
});

describe(`<${RecentActivityCard.name}/>`, () => {
  it("nests the card's title one level under the page's own h1", () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Recent activity',
    });

    expect(heading).toBeVisible();
  });

  it("links to the tenant's full activity page", () => {
    setup();

    const viewAllLink = screen.getByRole('link', { name: 'View all activity' });

    expect(viewAllLink).toHaveAttribute(
      'href',
      `/tenants/${MOCK_TENANT_ID}/activity`,
    );
  });
});
