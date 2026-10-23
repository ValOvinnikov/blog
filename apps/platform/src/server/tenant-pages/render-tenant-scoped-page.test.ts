import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockTenant } from '@platform/testing/tenants/fixtures';

import { renderTenantScopedPage } from './render-tenant-scoped-page';

const RENDERED_CONTENT = 'rendered content';

describe('renderTenantScopedPage', () => {
  it('hands the page content everything the resolver returned and returns its render', async () => {
    const context = { tenant: mockTenant(), membership: mockMembership() };
    const resolveTenant = vi.fn().mockResolvedValue(context);
    const PageContent = vi.fn().mockResolvedValue(RENDERED_CONTENT);

    const result = await renderTenantScopedPage(resolveTenant, PageContent);

    expect(resolveTenant).toHaveBeenCalledWith();
    expect(PageContent).toHaveBeenCalledWith(context);
    expect(result).toBe(RENDERED_CONTENT);
  });

  it('propagates a redirect thrown by the resolver without calling the content renderer', async () => {
    const resolveTenant = vi
      .fn()
      .mockRejectedValue(new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT));
    const PageContent = vi.fn();

    await expect(
      renderTenantScopedPage(resolveTenant, PageContent),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(PageContent).not.toHaveBeenCalled();
  });
});

describe('renderTenantScopedPage with a plan-gated page', () => {
  it("answers 404 when the tenant's plan cannot use the page", async () => {
    const tenant = mockTenant({ plan: TENANT_PLAN.FREE });
    const PageContent = vi.fn();

    await expect(
      renderTenantScopedPage(
        vi.fn().mockResolvedValue({ tenant }),
        PageContent,
        'languages',
      ),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(PageContent).not.toHaveBeenCalled();
  });

  it("renders the page when the tenant's plan can use it", async () => {
    const tenant = mockTenant({ plan: TENANT_PLAN.GROWTH });
    const PageContent = vi.fn().mockResolvedValue(RENDERED_CONTENT);

    await expect(
      renderTenantScopedPage(
        vi.fn().mockResolvedValue({ tenant }),
        PageContent,
        'languages',
      ),
    ).resolves.toBe(RENDERED_CONTENT);
  });
});
