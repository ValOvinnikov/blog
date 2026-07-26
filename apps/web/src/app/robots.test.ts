export {};

describe('robots', () => {
  afterEach(() => {
    vi.resetModules();
  });

  describe('production', () => {
    it('allows all crawlers and points sitemap at the absolute site URL', async () => {
      vi.doMock('@web/utils/env/env', () => ({
        env: { NEXT_PUBLIC_SITE_URL: 'https://example.com' },
      }));
      vi.doMock('@web/utils/is-production-environment', () => ({
        isProductionEnvironment: () => true,
      }));
      const robots = (await import('./robots')).default;

      expect(robots()).toEqual({
        rules: { userAgent: '*', allow: '/' },
        sitemap: 'https://example.com/sitemap.xml',
      });
    });

    it('falls back to a relative sitemap path when the site URL is unset', async () => {
      vi.doMock('@web/utils/env/env', () => ({ env: {} }));
      vi.doMock('@web/utils/is-production-environment', () => ({
        isProductionEnvironment: () => true,
      }));
      const robots = (await import('./robots')).default;

      expect(robots().sitemap).toBe('/sitemap.xml');
    });
  });

  describe('non-production', () => {
    it('allows crawling (so the page-level noindex meta is seen) but omits the sitemap', async () => {
      vi.doMock('@web/utils/env/env', () => ({
        env: { NEXT_PUBLIC_SITE_URL: 'https://dev.example.com' },
      }));
      vi.doMock('@web/utils/is-production-environment', () => ({
        isProductionEnvironment: () => false,
      }));
      const robots = (await import('./robots')).default;

      expect(robots()).toEqual({
        rules: { userAgent: '*', allow: '/' },
      });
    });
  });
});
