import type { TTenant } from '@blog/db/schema/tenants';

import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from './render-tenant-scoped-page';

describe('renderTenantScopedPage', () => {
  it('resolves the tenant and hands it to the page content renderer', async () => {
    const tenant = { id: 'tenant-1', slug: 'acme' } as TTenant;
    const resolveTenant = vi.fn().mockResolvedValue({ tenant });
    const PageContent = vi.fn().mockResolvedValue('rendered content');

    const result = await renderTenantScopedPage(resolveTenant, PageContent);

    expect(resolveTenant).toHaveBeenCalledWith();
    expect(PageContent).toHaveBeenCalledWith({ tenant });
    expect(result).toBe('rendered content');
  });

  it('propagates a redirect thrown by the resolver without calling the content renderer', async () => {
    const resolveTenant = vi.fn().mockRejectedValue(new Error('NEXT_REDIRECT'));
    const PageContent = vi.fn();

    await expect(
      renderTenantScopedPage(resolveTenant, PageContent),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(PageContent).not.toHaveBeenCalled();
  });
});

describe('tenantPageMetadata', () => {
  it('resolves the title for the given pageMetadata key', async () => {
    await expect(tenantPageMetadata('features')).resolves.toEqual({
      title: 'Features · Admin',
    });
    await expect(tenantPageMetadata('look')).resolves.toEqual({
      title: 'Look · Admin',
    });
    await expect(tenantPageMetadata('voice')).resolves.toEqual({
      title: 'Voice · Admin',
    });
  });
});
