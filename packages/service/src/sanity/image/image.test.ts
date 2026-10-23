import type { ISanityImage } from '@blog/config';
import {
  MOCK_IMAGE_ALT,
  MOCK_IMAGE_ASSET_ID,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import type { SanityImageSource } from '@sanity/image-url';

import { urlForImage, urlForSanityImage } from './image';

const IMAGE_URL_MODULE = '@sanity/image-url';
const { projectId, dataset } = mockTenant();
const TENANT_A = { projectId, dataset };
const TENANT_B = { ...TENANT_A, projectId: 'tenant-b' };

function imagesPath(project: { projectId: string }) {
  return `/images/${project.projectId}/`;
}

const image: SanityImageSource = {
  asset: { _ref: MOCK_IMAGE_ASSET_ID },
};

const sanityImage: ISanityImage = {
  assetId: MOCK_IMAGE_ASSET_ID,
  alt: MOCK_IMAGE_ALT,
  hotspot: undefined,
  crop: undefined,
  lqip: undefined,
  dimensions: undefined,
};

describe(urlForImage, () => {
  it('builds a URL scoped to the given project and dataset', () => {
    const url = urlForImage(image, TENANT_A);

    expect(url).toContain(`${imagesPath(TENANT_A)}${TENANT_A.dataset}/`);
  });

  it('scopes each of two projects in the same process to its own project', () => {
    const urlA = urlForImage(image, TENANT_A);
    const urlB = urlForImage(image, TENANT_B);

    expect(urlA).toContain(imagesPath(TENANT_A));
    expect(urlB).toContain(imagesPath(TENANT_B));
  });

  it('does not leak an earlier project into a later call for another project', () => {
    urlForImage(image, TENANT_A);
    const urlForSecondProject = urlForImage(image, TENANT_B);

    expect(urlForSecondProject).toContain(imagesPath(TENANT_B));
    expect(urlForSecondProject).not.toContain(imagesPath(TENANT_A));
  });

  it('applies transform options on top of the project-scoped builder', () => {
    const url = urlForImage(image, TENANT_A, {
      width: 64,
      height: 64,
      fit: 'crop',
    });

    expect(url).toContain('w=64');
    expect(url).toContain('h=64');
    expect(url).toContain('fit=crop');
  });
});

describe(urlForSanityImage, () => {
  const project = TENANT_A;
  const crop = { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 };

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

  it('carries crop and hotspot into the URL the same way urlForImage does', () => {
    const hotspot = { x: 0.5, y: 0.5, height: 0.8, width: 0.8 };
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
  let createImageUrlBuilderMock: ReturnType<
    typeof vi.fn<() => ReturnType<typeof makeFakeBuilder>>
  >;
  let freshUrlForImage: typeof urlForImage;

  beforeEach(async () => {
    vi.resetModules();
    createImageUrlBuilderMock = vi.fn(() => makeFakeBuilder());
    vi.doMock(IMAGE_URL_MODULE, () => ({
      createImageUrlBuilder: createImageUrlBuilderMock,
    }));

    ({ urlForImage: freshUrlForImage } = await import('./image'));
  });

  afterEach(() => {
    vi.doUnmock(IMAGE_URL_MODULE);
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

  it('reuses the cached builder for a repeated project instead of recreating it', () => {
    const project = TENANT_A;

    freshUrlForImage(image, project);
    freshUrlForImage(image, project);

    expect(createImageUrlBuilderMock).toHaveBeenCalledTimes(1);
  });

  it('creates a distinct builder per project', () => {
    freshUrlForImage(image, TENANT_A);
    freshUrlForImage(image, TENANT_B);

    expect(createImageUrlBuilderMock).toHaveBeenCalledTimes(2);
  });
});
