import type { ISanityImage } from '@blog/config';
import type { SanityImageSource } from '@sanity/image-url';

import { urlForImage, urlForSanityImage } from './image';

const image: SanityImageSource = {
  asset: { _ref: 'image-abc123-800x600-jpg' },
};

const sanityImage: ISanityImage = {
  assetId: 'image-abc123-800x600-jpg',
  alt: 'Alt text',
  hotspot: undefined,
  crop: undefined,
  lqip: undefined,
  dimensions: undefined,
};

describe(urlForImage, () => {
  it('builds a URL scoped to the given tenant project and dataset', () => {
    const url = urlForImage(image, {
      projectId: 'tenant-a',
      dataset: 'production',
    });

    expect(url).toContain('/images/tenant-a/production/');
  });

  it('resolves two different tenants rendered in the same process to their own project', () => {
    const urlA = urlForImage(image, {
      projectId: 'tenant-a',
      dataset: 'production',
    });
    const urlB = urlForImage(image, {
      projectId: 'tenant-b',
      dataset: 'production',
    });

    expect(urlA).toContain('/images/tenant-a/');
    expect(urlB).toContain('/images/tenant-b/');
  });

  it('does not carry a tenant resolved earlier in the process into a later call for a different tenant', () => {
    urlForImage(image, { projectId: 'tenant-a', dataset: 'production' });
    const urlForSecondTenant = urlForImage(image, {
      projectId: 'tenant-b',
      dataset: 'production',
    });

    expect(urlForSecondTenant).toContain('/images/tenant-b/');
    expect(urlForSecondTenant).not.toContain('/images/tenant-a/');
  });

  it('applies transform options on top of the tenant-scoped builder', () => {
    const url = urlForImage(
      image,
      { projectId: 'tenant-a', dataset: 'production' },
      { width: 64, height: 64, fit: 'crop' },
    );

    expect(url).toContain('w=64');
    expect(url).toContain('h=64');
    expect(url).toContain('fit=crop');
  });
});

describe(urlForSanityImage, () => {
  const tenant = { projectId: 'tenant-a', dataset: 'production' };

  it('produces the same URL as urlForImage for the same asset', () => {
    expect(urlForSanityImage(sanityImage, tenant)).toBe(
      urlForImage(image, tenant),
    );
  });

  it('produces the same URL as urlForImage with transform options applied', () => {
    const options = { width: 64, height: 64, fit: 'crop' as const };

    expect(urlForSanityImage(sanityImage, tenant, options)).toBe(
      urlForImage(image, tenant, options),
    );
  });

  it('carries crop and hotspot through to the URL, matching urlForImage given the same source', () => {
    const hotspot = { x: 0.5, y: 0.5, height: 0.8, width: 0.8 };
    const crop = { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 };
    const options = { width: 400, height: 300 };

    const fromSanityImage = urlForSanityImage(
      { ...sanityImage, hotspot, crop },
      tenant,
      options,
    );
    const fromRawSource = urlForImage(
      { ...image, hotspot, crop },
      tenant,
      options,
    );

    expect(fromSanityImage).toBe(fromRawSource);
    expect(fromSanityImage).toContain('rect=');
  });
});

describe('tenant image builder cache', () => {
  afterEach(() => {
    vi.doUnmock('@sanity/image-url');
    vi.resetModules();
  });

  function makeFakeBuilder() {
    const builder = {
      image: vi.fn(() => builder),
      auto: vi.fn(() => builder),
      url: vi.fn(() => 'https://cdn.sanity.io/mock.jpg'),
    };
    return builder;
  }

  it('reuses the cached builder for a repeated tenant instead of recreating it', async () => {
    vi.resetModules();
    const createImageUrlBuilderMock = vi.fn(() => makeFakeBuilder());
    vi.doMock('@sanity/image-url', () => ({
      createImageUrlBuilder: createImageUrlBuilderMock,
    }));

    const { urlForImage: freshUrlForImage } = await import('./image');
    const tenant = { projectId: 'tenant-a', dataset: 'production' };

    freshUrlForImage(image, tenant);
    freshUrlForImage(image, tenant);

    expect(createImageUrlBuilderMock).toHaveBeenCalledTimes(1);
  });

  it('creates a distinct builder per tenant', async () => {
    vi.resetModules();
    const createImageUrlBuilderMock = vi.fn(() => makeFakeBuilder());
    vi.doMock('@sanity/image-url', () => ({
      createImageUrlBuilder: createImageUrlBuilderMock,
    }));

    const { urlForImage: freshUrlForImage } = await import('./image');

    freshUrlForImage(image, { projectId: 'tenant-a', dataset: 'production' });
    freshUrlForImage(image, { projectId: 'tenant-b', dataset: 'production' });

    expect(createImageUrlBuilderMock).toHaveBeenCalledTimes(2);
  });
});
