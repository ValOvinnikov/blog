export {};

describe('isProductionEnvironment', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('returns true when NEXT_PUBLIC_SANITY_DATASET is production', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { NEXT_PUBLIC_SANITY_DATASET: 'production' },
    }));
    const { isProductionEnvironment } =
      await import('./is-production-environment');

    expect(isProductionEnvironment()).toBe(true);
  });

  it('returns false for any non-production dataset', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { NEXT_PUBLIC_SANITY_DATASET: 'development' },
    }));
    const { isProductionEnvironment } =
      await import('./is-production-environment');

    expect(isProductionEnvironment()).toBe(false);
  });
});
