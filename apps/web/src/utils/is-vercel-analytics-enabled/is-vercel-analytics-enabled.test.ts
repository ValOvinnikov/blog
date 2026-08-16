export {};

describe('isVercelAnalyticsEnabled', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('returns true when VERCEL_ANALYTICS_ENABLED is "true"', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { VERCEL_ANALYTICS_ENABLED: 'true' },
    }));
    const { isVercelAnalyticsEnabled } =
      await import('./is-vercel-analytics-enabled');

    expect(isVercelAnalyticsEnabled()).toBe(true);
  });

  it('returns false when VERCEL_ANALYTICS_ENABLED is "false"', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { VERCEL_ANALYTICS_ENABLED: 'false' },
    }));
    const { isVercelAnalyticsEnabled } =
      await import('./is-vercel-analytics-enabled');

    expect(isVercelAnalyticsEnabled()).toBe(false);
  });

  it('returns false when VERCEL_ANALYTICS_ENABLED is unset', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { VERCEL_ANALYTICS_ENABLED: undefined },
    }));
    const { isVercelAnalyticsEnabled } =
      await import('./is-vercel-analytics-enabled');

    expect(isVercelAnalyticsEnabled()).toBe(false);
  });
});
