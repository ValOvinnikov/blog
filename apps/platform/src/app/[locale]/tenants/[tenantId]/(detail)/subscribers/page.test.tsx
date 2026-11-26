import messages from '@platform/i18n/messages/en.json';
import { loadSubscribersPage } from '@platform/server/subscribers/load-subscribers-page';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockOperatorMembershipContext } from '@platform/testing/memberships/fixtures';
import { mockSubscribersPageData } from '@platform/testing/subscribers/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import {
  NEXT_NAVIGATION_ERROR,
  TENANT_PLAN,
  type TTenantPlan,
} from '@shinefold/config';

import TenantSubscribersPage from './page';

const { requireTenantByIdMock } = vi.hoisted(() => ({
  requireTenantByIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-by-id', () => ({
  requireTenantById: requireTenantByIdMock,
}));
vi.mock('@platform/server/subscribers/load-subscribers-page', () => ({
  loadSubscribersPage: vi.fn(),
}));
vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/subscribers/export-subscribers-action');
vi.mock('@platform/server/subscribers/remove-subscriber-action');
vi.mock('@platform/server/subscribers/set-email-new-posts-action');
vi.mock('@platform/utils/stripe-env/stripe-env');

const PAGE = 2;

const setup = customRenderAsync(TenantSubscribersPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
  searchParams: Promise.resolve({ page: String(PAGE) }),
});

const signInOperatorOn = (plan: TTenantPlan) => {
  const tenant = mockReadyTenant({ plan });
  requireTenantByIdMock.mockResolvedValueOnce(
    mockOperatorMembershipContext(tenant),
  );
};

describe(`<${TenantSubscribersPage.name}/>`, () => {
  it("shows an operator the requested site's subscribers, paged on the tenant route", async () => {
    vi.mocked(loadSubscribersPage).mockResolvedValue(mockSubscribersPageData());
    signInOperatorOn(TENANT_PLAN.GROWTH);

    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: messages.subscribersPage.title,
    });
    const [, query] = vi.mocked(loadSubscribersPage).mock.calls[0]!;

    expect(requireTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(heading).toBeVisible();
    expect(query.page).toBe(PAGE);
    expect(query.pageHref(PAGE)).toBe(
      adminRoutes.tenantSubscribers(MOCK_TENANT_ID, PAGE),
    );
  });

  it('404s for a site whose plan has no Newsletter', async () => {
    signInOperatorOn(TENANT_PLAN.FREE);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(loadSubscribersPage).not.toHaveBeenCalled();
  });
});
