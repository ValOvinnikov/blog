export {};

describe('robots', () => {
  afterEach(() => {
    vi.resetModules();
  });

  describe('production', () => {
    it('allows all crawlers and points sitemap at the absolute site URL', async () => {
      vi.doMock('@web/server/tenant/get-tenant-base-url', () => ({
        getTenantBaseUrl: async () => 'https://example.com',
      }));
      vi.doMock('@web/utils/is-production-environment', () => ({
        isProductionEnvironment: () => true,
      }));
      const robots = (await import('./robots')).default;

      await expect(robots()).resolves.toEqual({
        rules: { userAgent: '*', allow: '/' },
        sitemap: 'https://example.com/sitemap.xml',
      });
    });

    it('falls back to a relative sitemap path when no base URL resolves', async () => {
      vi.doMock('@web/server/tenant/get-tenant-base-url', () => ({
        getTenantBaseUrl: async () => undefined,
      }));
      vi.doMock('@web/utils/is-production-environment', () => ({
        isProductionEnvironment: () => true,
      }));
      const robots = (await import('./robots')).default;

      await expect(robots()).resolves.toMatchObject({
        sitemap: '/sitemap.xml',
      });
    });
  });

  describe('non-production', () => {
    it('allows crawling (so the page-level noindex meta is seen) but omits the sitemap', async () => {
      vi.doMock('@web/server/tenant/get-tenant-base-url', () => ({
        getTenantBaseUrl: async () => 'https://dev.example.com',
      }));
      vi.doMock('@web/utils/is-production-environment', () => ({
        isProductionEnvironment: () => false,
      }));
      const robots = (await import('./robots')).default;

      await expect(robots()).resolves.toEqual({
        rules: { userAgent: '*', allow: '/' },
      });
    });
  });
});
