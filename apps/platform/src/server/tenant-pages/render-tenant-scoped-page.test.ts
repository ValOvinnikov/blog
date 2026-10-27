import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockTenant } from '@platform/testing/tenants/fixtures';

import { renderTenantScopedPage } from './render-tenant-scoped-page';

faker.seed(5998);

const MOCK_RENDERED_CONTENT = faker.lorem.sentence();
const PLAN_GATED_PAGE = 'languages';

describe(renderTenantScopedPage, () => {
  it('hands the page content what the resolver returned and returns its render', async () => {
    const context = { tenant: mockTenant(), membership: mockMembership() };
    const resolveTenant = vi.fn().mockResolvedValue(context);
    const PageContent = vi.fn().mockResolvedValue(MOCK_RENDERED_CONTENT);

    const result = await renderTenantScopedPage(resolveTenant, PageContent);

    expect(resolveTenant).toHaveBeenCalledWith();
    expect(PageContent).toHaveBeenCalledWith(context);
    expect(result).toBe(MOCK_RENDERED_CONTENT);
  });

  it('propagates a resolver redirect without calling the content renderer', async () => {
    const resolveTenant = vi
      .fn()
      .mockRejectedValue(new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT));
    const PageContent = vi.fn();

    await expect(
      renderTenantScopedPage(resolveTenant, PageContent),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(PageContent).not.toHaveBeenCalled();
  });

  it("answers 404 when the tenant's plan cannot use a gated page", async () => {
    const tenant = mockTenant({ plan: TENANT_PLAN.FREE });
    const PageContent = vi.fn();

    await expect(
      renderTenantScopedPage(
        vi.fn().mockResolvedValue({ tenant }),
        PageContent,
        PLAN_GATED_PAGE,
      ),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(PageContent).not.toHaveBeenCalled();
  });

  it("renders a gated page when the tenant's plan can use it", async () => {
    const tenant = mockTenant({ plan: TENANT_PLAN.GROWTH });
    const PageContent = vi.fn().mockResolvedValue(MOCK_RENDERED_CONTENT);

    await expect(
      renderTenantScopedPage(
        vi.fn().mockResolvedValue({ tenant }),
        PageContent,
        PLAN_GATED_PAGE,
      ),
    ).resolves.toBe(MOCK_RENDERED_CONTENT);
  });
});
