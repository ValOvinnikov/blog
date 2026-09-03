import { getSanityImageBaseUrl } from './image-base-url';

describe('getSanityImageBaseUrl', () => {
  it('builds the CDN base URL from the given tenant', () => {
    expect(
      getSanityImageBaseUrl({ projectId: 'tenant-a', dataset: 'production' }),
    ).toBe('https://cdn.sanity.io/images/tenant-a/production/');
  });

  it('carries the passed tenant projectId/dataset, not some other value', () => {
    expect(
      getSanityImageBaseUrl({ projectId: 'tenant-b', dataset: 'staging' }),
    ).toBe('https://cdn.sanity.io/images/tenant-b/staging/');
  });
});
