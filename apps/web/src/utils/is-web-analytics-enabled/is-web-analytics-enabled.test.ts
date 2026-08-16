export {};

describe('isWebAnalyticsEnabled', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('returns true when WEB_ANALYTICS_ENABLED is "true"', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { WEB_ANALYTICS_ENABLED: 'true' },
    }));
    const { isWebAnalyticsEnabled } =
      await import('./is-web-analytics-enabled');

    expect(isWebAnalyticsEnabled()).toBe(true);
  });

  it('returns false when WEB_ANALYTICS_ENABLED is "false"', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { WEB_ANALYTICS_ENABLED: 'false' },
    }));
    const { isWebAnalyticsEnabled } =
      await import('./is-web-analytics-enabled');

    expect(isWebAnalyticsEnabled()).toBe(false);
  });

  it('returns false when WEB_ANALYTICS_ENABLED is unset', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { WEB_ANALYTICS_ENABLED: undefined },
    }));
    const { isWebAnalyticsEnabled } =
      await import('./is-web-analytics-enabled');

    expect(isWebAnalyticsEnabled()).toBe(false);
  });
});
