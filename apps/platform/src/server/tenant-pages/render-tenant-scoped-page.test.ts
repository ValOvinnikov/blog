import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { makeMembership } from '@platform/testing/memberships/fixtures';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { renderTenantScopedPage } from './render-tenant-scoped-page';

describe('renderTenantScopedPage', () => {
  it('resolves the tenant and hands it to the page content renderer', async () => {
    const tenant = makeTenant();
    const resolveTenant = vi.fn().mockResolvedValue({ tenant });
    const PageContent = vi.fn().mockResolvedValue('rendered content');

    const result = await renderTenantScopedPage(resolveTenant, PageContent);

    expect(resolveTenant).toHaveBeenCalledWith();
    expect(PageContent).toHaveBeenCalledWith({ tenant });
    expect(result).toBe('rendered content');
  });

  it('hands the page content everything the resolver returned', async () => {
    const context = { tenant: makeTenant(), membership: makeMembership() };
    const PageContent = vi.fn().mockResolvedValue('rendered content');

    await renderTenantScopedPage(
      vi.fn().mockResolvedValue(context),
      PageContent,
    );

    expect(PageContent).toHaveBeenCalledWith(context);
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
    const tenant = makeTenant({ plan: TENANT_PLAN.FREE });
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
    const tenant = makeTenant({ plan: TENANT_PLAN.GROWTH });
    const PageContent = vi.fn().mockResolvedValue('rendered content');

    await expect(
      renderTenantScopedPage(
        vi.fn().mockResolvedValue({ tenant }),
        PageContent,
        'languages',
      ),
    ).resolves.toBe('rendered content');
  });
});
