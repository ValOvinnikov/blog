import messages from '@platform/i18n/messages/en.json';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { loadSubscribersPage } from '@platform/server/subscribers/load-subscribers-page';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import {
  mockMembershipContext,
  mockOperatorMembershipContext,
} from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockPlatformNewsletterTenant,
  mockSubscribersPageData,
} from '@platform/testing/subscribers/fixtures';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { ADMIN_ROLE } from '@shinefold/db/constants';

import DashboardSubscribersPage from './page';

vi.mock('@platform/server/auth/resolve-dashboard-tenant', () => ({
  resolveDashboardTenant: vi.fn(),
}));
vi.mock('@platform/server/subscribers/load-subscribers-page', () => ({
  loadSubscribersPage: vi.fn(),
}));
vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { memberships: { getMembership: vi.fn(async () => undefined) } },
}));
vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/subscribers/export-subscribers-action');
vi.mock('@platform/server/subscribers/remove-subscriber-action');
vi.mock('@platform/server/subscribers/set-email-new-posts-action');
vi.mock('@platform/utils/stripe-env/stripe-env');

const setup = customRenderAsync(DashboardSubscribersPage, {
  searchParams: Promise.resolve({}),
});

describe(`<${DashboardSubscribersPage.name}/>`, () => {
  it("shows the owner their site's subscribers", async () => {
    vi.mocked(resolveDashboardTenant).mockResolvedValue({
      ...mockMembershipContext(
        mockPlatformNewsletterTenant({ createdFromPlatform: false }),
      ),
      tenants: [],
    });
    vi.mocked(loadSubscribersPage).mockResolvedValue(mockSubscribersPageData());

    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: messages.subscribersPage.title,
    });

    expect(heading).toBeVisible();
  });

  it('is not found for a super admin on a self-serve site they do not own', async () => {
    vi.mocked(resolveDashboardTenant).mockResolvedValue({
      ...mockOperatorMembershipContext(
        mockPlatformNewsletterTenant({ createdFromPlatform: false }),
        ADMIN_ROLE.SUPERADMIN,
      ),
      tenants: [],
    });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(loadSubscribersPage).not.toHaveBeenCalled();
  });
});
