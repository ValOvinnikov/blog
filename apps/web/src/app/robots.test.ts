export {};

describe('robots', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('allows all crawlers and points sitemap at the absolute site URL', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { NEXT_PUBLIC_SITE_URL: 'https://example.com' },
    }));
    const robots = (await import('./robots')).default;

    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://example.com/sitemap.xml',
    });
  });

  it('falls back to a relative sitemap path when the site URL is unset', async () => {
    vi.doMock('@web/utils/env/env', () => ({ env: {} }));
    const robots = (await import('./robots')).default;

    expect(robots().sitemap).toBe('/sitemap.xml');
  });
});
