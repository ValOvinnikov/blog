import messages from '@platform/i18n/messages/en.json';
import { loadSubscribersPage } from '@platform/server/subscribers/load-subscribers-page';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockOperatorViewer } from '@platform/testing/memberships/fixtures';
import {
  mockPlatformNewsletterTenant,
  mockSubscribersPageData,
} from '@platform/testing/subscribers/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { NEXT_NAVIGATION_ERROR, TENANT_PLAN } from '@shinefold/config';
import { ADMIN_ROLE, type TAdminRole } from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';

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

const signInAs = (role: TAdminRole, tenantOverrides: Partial<TTenant> = {}) => {
  requireTenantByIdMock.mockResolvedValueOnce({
    tenant: mockPlatformNewsletterTenant(tenantOverrides),
    viewer: mockOperatorViewer(role),
  });
};

describe(`<${TenantSubscribersPage.name}/>`, () => {
  it("pages a platform-created site's list on the tenant route", async () => {
    vi.mocked(loadSubscribersPage).mockResolvedValue(mockSubscribersPageData());
    signInAs(ADMIN_ROLE.SUPERADMIN);

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

  it("links the empty state to the site's own Studio", async () => {
    vi.mocked(loadSubscribersPage).mockResolvedValue(
      mockSubscribersPageData({ list: { rows: [], total: 0 } }),
    );
    signInAs(ADMIN_ROLE.SUPERADMIN);

    await setup();

    const link = screen.getByRole('link', {
      name: messages.subscribersPage.empty.action,
    });

    expect(link).toHaveAttribute(
      'href',
      adminRoutes.tenantStudioPages(MOCK_TENANT_ID),
    );
  });

  it.each<[string, TAdminRole, Partial<TTenant>]>([
    ['an admin', ADMIN_ROLE.ADMIN, {}],
    [
      'a super admin on a self-serve site',
      ADMIN_ROLE.SUPERADMIN,
      { createdFromPlatform: false },
    ],
    [
      'a super admin on a site without Newsletter',
      ADMIN_ROLE.SUPERADMIN,
      { plan: TENANT_PLAN.FREE },
    ],
  ])('is not found for %s', async (_viewer, role, tenantOverrides) => {
    signInAs(role, tenantOverrides);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(loadSubscribersPage).not.toHaveBeenCalled();
  });
});
