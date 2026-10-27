import type { ISanityImage } from '@blog/config';
import {
  MOCK_IMAGE_ALT,
  MOCK_IMAGE_ASSET_ID,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';
import type { SanityImageSource } from '@sanity/image-url';

import { urlForImage, urlForSanityImage } from './image';

faker.seed(6016);

const IMAGE_URL_MODULE = '@sanity/image-url';
const RECT_PARAM = 'rect';
const AUTO_FORMAT_QUERY = 'auto=format';
const MOCK_IMAGE_FILENAME = 'abc123-800x600.jpg';
const MOCK_BUILT_URL = faker.internet.url();
const { projectId, dataset } = mockTenant();
const MOCK_PROJECT = { projectId, dataset };
const MOCK_OTHER_PROJECT = {
  ...MOCK_PROJECT,
  projectId: faker.string.alphanumeric(8),
};
const MOCK_CROP = { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 };
const MOCK_HOTSPOT = { x: 0.5, y: 0.5, height: 0.8, width: 0.8 };

const MOCK_IMAGE_SOURCE: SanityImageSource = {
  asset: { _ref: MOCK_IMAGE_ASSET_ID },
};

const MOCK_SANITY_IMAGE: ISanityImage = {
  assetId: MOCK_IMAGE_ASSET_ID,
  alt: MOCK_IMAGE_ALT,
  hotspot: undefined,
  crop: undefined,
  lqip: undefined,
  dimensions: undefined,
};

function imageUrl(project: typeof MOCK_PROJECT, query: string) {
  return `https://cdn.sanity.io/images/${project.projectId}/${project.dataset}/${MOCK_IMAGE_FILENAME}?${query}`;
}

function hasRect(url: string) {
  return new URL(url).searchParams.has(RECT_PARAM);
}

describe(urlForImage, () => {
  it('builds a URL scoped to the given project and dataset', () => {
    const url = urlForImage(MOCK_IMAGE_SOURCE, MOCK_PROJECT);

    expect(url).toBe(imageUrl(MOCK_PROJECT, AUTO_FORMAT_QUERY));
  });

  it('does not leak an earlier project into a later call for another project', () => {
    urlForImage(MOCK_IMAGE_SOURCE, MOCK_PROJECT);
    const url = urlForImage(MOCK_IMAGE_SOURCE, MOCK_OTHER_PROJECT);

    expect(url).toBe(imageUrl(MOCK_OTHER_PROJECT, AUTO_FORMAT_QUERY));
  });

  it('applies transform options on top of the project-scoped builder', () => {
    const url = urlForImage(MOCK_IMAGE_SOURCE, MOCK_PROJECT, {
      width: 64,
      height: 64,
      fit: 'crop',
    });

    expect(url).toBe(
      imageUrl(
        MOCK_PROJECT,
        'rect=100,0,600,600&w=64&h=64&fit=crop&auto=format',
      ),
    );
  });

  describe('with a faked image URL builder', () => {
    let createImageUrlBuilderMock: ReturnType<
      typeof vi.fn<() => ReturnType<typeof mockImageUrlBuilder>>
    >;
    let freshUrlForImage: typeof urlForImage;

    function mockImageUrlBuilder() {
      const builder = {
        image: vi.fn(() => builder),
        auto: vi.fn(() => builder),
        url: vi.fn(() => MOCK_BUILT_URL),
      };
      return builder;
    }

    beforeEach(async () => {
      vi.resetModules();
      createImageUrlBuilderMock = vi.fn(() => mockImageUrlBuilder());
      vi.doMock(IMAGE_URL_MODULE, () => ({
        createImageUrlBuilder: createImageUrlBuilderMock,
      }));

      ({ urlForImage: freshUrlForImage } = await import('./image'));
    });

    afterEach(() => {
      vi.doUnmock(IMAGE_URL_MODULE);
      vi.resetModules();
    });

    it('reuses the cached builder for a repeated project', () => {
      freshUrlForImage(MOCK_IMAGE_SOURCE, MOCK_PROJECT);
      freshUrlForImage(MOCK_IMAGE_SOURCE, MOCK_PROJECT);

      expect(createImageUrlBuilderMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe(urlForSanityImage, () => {
  it.each([
    { case: 'without options', options: undefined },
    {
      case: 'with transform options',
      options: { width: 64, height: 64, fit: 'crop' as const },
    },
  ])('builds the same URL as urlForImage $case', ({ options }) => {
    const url = urlForSanityImage(MOCK_SANITY_IMAGE, MOCK_PROJECT, options);

    expect(url).toBe(urlForImage(MOCK_IMAGE_SOURCE, MOCK_PROJECT, options));
  });

  it.each([
    {
      case: 'crop and hotspot with options',
      focus: { crop: MOCK_CROP, hotspot: MOCK_HOTSPOT },
      options: { width: 400, height: 300 },
    },
    {
      case: 'a crop without options',
      focus: { crop: MOCK_CROP },
      options: undefined,
    },
  ])('carries $case into a rect like urlForImage', ({ focus, options }) => {
    const url = urlForSanityImage(
      { ...MOCK_SANITY_IMAGE, ...focus },
      MOCK_PROJECT,
      options,
    );

    expect(url).toBe(
      urlForImage({ ...MOCK_IMAGE_SOURCE, ...focus }, MOCK_PROJECT, options),
    );
    expect(hasRect(url)).toBe(true);
  });

  it('computes a hotspot-aware rect when width and height are both given', () => {
    const options = { width: 300, height: 400 };
    const hotspotLeft = { x: 0.15, y: 0.5, height: 0.2, width: 0.2 };
    const hotspotRight = { x: 0.85, y: 0.5, height: 0.2, width: 0.2 };

    const urlLeft = urlForSanityImage(
      { ...MOCK_SANITY_IMAGE, hotspot: hotspotLeft },
      MOCK_PROJECT,
      options,
    );
    const urlRight = urlForSanityImage(
      { ...MOCK_SANITY_IMAGE, hotspot: hotspotRight },
      MOCK_PROJECT,
      options,
    );

    expect(hasRect(urlLeft)).toBe(true);
    expect(urlLeft).not.toBe(urlRight);
    expect(urlLeft).toBe(
      urlForImage(
        { ...MOCK_IMAGE_SOURCE, hotspot: hotspotLeft },
        MOCK_PROJECT,
        options,
      ),
    );
    expect(urlRight).toBe(
      urlForImage(
        { ...MOCK_IMAGE_SOURCE, hotspot: hotspotRight },
        MOCK_PROJECT,
        options,
      ),
    );
  });

  it('omits the rect for an image with neither crop nor hotspot', () => {
    const url = urlForSanityImage(MOCK_SANITY_IMAGE, MOCK_PROJECT);

    expect(hasRect(url)).toBe(false);
  });
});
