export {};

describe('getSanityImageBaseUrl', () => {
  const originalProjectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
  const originalDataset = process.env['NEXT_PUBLIC_SANITY_DATASET'];

  afterEach(() => {
    if (originalProjectId === undefined) {
      delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    } else {
      process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = originalProjectId;
    }
    if (originalDataset === undefined) {
      delete process.env['NEXT_PUBLIC_SANITY_DATASET'];
    } else {
      process.env['NEXT_PUBLIC_SANITY_DATASET'] = originalDataset;
    }
    vi.resetModules();
  });

  it('builds the CDN base URL from the env-configured project/dataset when called without a tenant', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'env-project';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'env-dataset';
    vi.resetModules();

    const { getSanityImageBaseUrl } = await import('./image-base-url');

    expect(getSanityImageBaseUrl()).toBe(
      'https://cdn.sanity.io/images/env-project/env-dataset/',
    );
  });

  it('builds the CDN base URL from a tenant context, overriding the env values', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'env-project';
    process.env['NEXT_PUBLIC_SANITY_DATASET'] = 'env-dataset';
    vi.resetModules();

    const { getSanityImageBaseUrl } = await import('./image-base-url');

    expect(
      getSanityImageBaseUrl({
        projectId: 'tenant-a',
        dataset: 'production',
        token: 'tok-a',
      }),
    ).toBe('https://cdn.sanity.io/images/tenant-a/production/');
  });
});
