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
  it('builds a URL scoped to the given project and dataset', () => {
    const url = urlForImage(image, {
      projectId: 'tenant-a',
      dataset: 'production',
    });

    expect(url).toContain('/images/tenant-a/production/');
  });

  it('resolves two different projects rendered in the same process to their own project', () => {
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

  it('does not carry a project resolved earlier in the process into a later call for a different project', () => {
    urlForImage(image, { projectId: 'tenant-a', dataset: 'production' });
    const urlForSecondProject = urlForImage(image, {
      projectId: 'tenant-b',
      dataset: 'production',
    });

    expect(urlForSecondProject).toContain('/images/tenant-b/');
    expect(urlForSecondProject).not.toContain('/images/tenant-a/');
  });

  it('applies transform options on top of the project-scoped builder', () => {
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
  const project = { projectId: 'tenant-a', dataset: 'production' };

  it('produces the same URL as urlForImage for the same asset', () => {
    expect(urlForSanityImage(sanityImage, project)).toBe(
      urlForImage(image, project),
    );
  });

  it('produces the same URL as urlForImage with transform options applied', () => {
    const options = { width: 64, height: 64, fit: 'crop' as const };

    expect(urlForSanityImage(sanityImage, project, options)).toBe(
      urlForImage(image, project, options),
    );
  });

  it('carries crop and hotspot through to the URL, matching urlForImage given the same source', () => {
    const hotspot = { x: 0.5, y: 0.5, height: 0.8, width: 0.8 };
    const crop = { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 };
    const options = { width: 400, height: 300 };

    const fromSanityImage = urlForSanityImage(
      { ...sanityImage, hotspot, crop },
      project,
      options,
    );
    const fromRawSource = urlForImage(
      { ...image, hotspot, crop },
      project,
      options,
    );

    expect(fromSanityImage).toBe(fromRawSource);
    expect(fromSanityImage).toContain('rect=');
  });

  it('still emits a rect for a crop with no transform options', () => {
    const crop = { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 };

    const fromSanityImage = urlForSanityImage(
      { ...sanityImage, crop },
      project,
    );
    const fromRawSource = urlForImage({ ...image, crop }, project);

    expect(fromSanityImage).toBe(fromRawSource);
    expect(fromSanityImage).toContain('rect=');
  });

  it('computes a hotspot-aware rect when width and height are both given', () => {
    const options = { width: 300, height: 400 };
    const hotspotLeft = { x: 0.15, y: 0.5, height: 0.2, width: 0.2 };
    const hotspotRight = { x: 0.85, y: 0.5, height: 0.2, width: 0.2 };

    const urlLeft = urlForSanityImage(
      { ...sanityImage, hotspot: hotspotLeft },
      project,
      options,
    );
    const urlRight = urlForSanityImage(
      { ...sanityImage, hotspot: hotspotRight },
      project,
      options,
    );

    expect(urlLeft).toContain('rect=');
    expect(urlLeft).not.toBe(urlRight);
    expect(urlLeft).toBe(
      urlForImage({ ...image, hotspot: hotspotLeft }, project, options),
    );
    expect(urlRight).toBe(
      urlForImage({ ...image, hotspot: hotspotRight }, project, options),
    );
  });

  it('omits rect entirely for an image with neither crop nor hotspot', () => {
    const url = urlForSanityImage(sanityImage, project);

    expect(url).not.toContain('rect=');
    expect(url).toBe(urlForImage(image, project));
  });
});

describe('project image builder cache', () => {
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

  it('reuses the cached builder for a repeated project instead of recreating it', async () => {
    vi.resetModules();
    const createImageUrlBuilderMock = vi.fn(() => makeFakeBuilder());
    vi.doMock('@sanity/image-url', () => ({
      createImageUrlBuilder: createImageUrlBuilderMock,
    }));

    const { urlForImage: freshUrlForImage } = await import('./image');
    const project = { projectId: 'tenant-a', dataset: 'production' };

    freshUrlForImage(image, project);
    freshUrlForImage(image, project);

    expect(createImageUrlBuilderMock).toHaveBeenCalledTimes(1);
  });

  it('creates a distinct builder per project', async () => {
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
