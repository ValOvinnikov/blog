import type { ISanityImage } from '@blog/config';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';

import { SanityImage } from './sanity-image';

const image: ISanityImage = {
  assetId: 'image-abc123-800x600-jpg',
  alt: 'A scenic mountain range',
  hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
  crop: undefined,
  lqip: undefined,
  dimensions: { width: 800, height: 600, aspectRatio: 800 / 600 },
};

const wideImage: ISanityImage = {
  assetId: 'image-abc123-2400x1260-png',
  alt: 'A wide banner image',
  hotspot: undefined,
  crop: undefined,
  lqip: undefined,
  dimensions: { width: 2400, height: 1260, aspectRatio: 2400 / 1260 },
};

const setup = customRender(SanityImage, {
  image,
  width: 960,
  height: 720,
});

const setupWide = customRender(SanityImage, {
  image: wideImage,
  width: 800,
  height: 600,
});

describe(`<${SanityImage.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders an img pointing at the Sanity CDN with a srcset', () => {
      const img = screen.getByRole('img', { name: image.alt });
      expect(img).toHaveAttribute(
        'src',
        expect.stringContaining('https://cdn.sanity.io'),
      );
      expect(img.getAttribute('srcset')).toContain('cdn.sanity.io');
    });

    it('renders against the default test baseUrl when no override provider is nested', () => {
      const img = screen.getByRole('img', { name: image.alt });
      expect(img.getAttribute('src')).toContain(STATIC_SANITY_IMAGE_BASE_URL);
    });

    it('falls back to the image alt text when no override is provided', () => {
      expect(screen.getByAltText(image.alt)).toBeVisible();
    });

    it('renders no fetchpriority attribute when priority is omitted (default false)', () => {
      expect(screen.getByRole('img', { name: image.alt })).not.toHaveAttribute(
        'fetchpriority',
      );
    });
  });

  it('renders against the tenant baseUrl supplied by the surrounding SanityImageBaseUrlProvider, not a hardcoded origin', () => {
    const otherBaseUrl =
      'https://cdn.sanity.io/images/other-project/other-dataset/';

    renderElement(
      <SanityImageBaseUrlProvider baseUrl={otherBaseUrl}>
        <SanityImage image={image} width={960} height={720} />
      </SanityImageBaseUrlProvider>,
    );

    const img = screen.getByRole('img', { name: image.alt });
    expect(img.getAttribute('src')).toContain('other-project/other-dataset');
    expect(img.getAttribute('srcset')).toContain('other-project/other-dataset');
  });

  it('uses the provided alt override instead of the image alt', () => {
    setup({ alt: 'Custom alt' });

    expect(screen.getByAltText('Custom alt')).toBeVisible();
    expect(screen.queryByAltText(image.alt)).not.toBeInTheDocument();
  });

  it('forwards sizes and loading to the rendered element', () => {
    setup({
      sizes: '(min-width: 1024px) 50vw, 100vw',
      loading: 'eager',
    });

    const img = screen.getByRole('img', { name: image.alt });
    expect(img).toHaveAttribute('sizes', '(min-width: 1024px) 50vw, 100vw');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('sets fetchpriority="high" on the rendered img when priority is true', () => {
    setup({ priority: true });

    expect(screen.getByRole('img', { name: image.alt })).toHaveAttribute(
      'fetchpriority',
      'high',
    );
  });

  it('withholds the LQIP preview for a priority image, rendering a single img with no hydration-gated placeholder swap', () => {
    setup({
      priority: true,
      image: { ...image, lqip: 'data:image/webp;base64,fake' },
    });

    const images = screen.getAllByRole('img', { name: image.alt });
    expect(images).toHaveLength(1);
    expect(images[0]).not.toHaveAttribute('data-lqip');
    expect(images[0]).toHaveAttribute(
      'src',
      expect.stringContaining('https://cdn.sanity.io'),
    );
  });

  it('renders the LQIP blur-up placeholder for a non-priority image with a preview available', () => {
    setup({
      image: { ...image, lqip: 'data:image/webp;base64,fake' },
    });

    expect(screen.getByRole('img', { name: image.alt })).toBeVisible();
    expect(screen.getByRole('presentation')).not.toBeVisible();
  });

  it('crops a hotspot-less, mismatched-ratio cover image from its centre instead of an entropy heuristic', () => {
    setupWide();

    const img = screen.getByRole('img', { name: wideImage.alt });
    expect(img.getAttribute('src')).toMatch(/[?&]fp-x=0\.5(?:&|$)/);
    expect(img.getAttribute('src')).toMatch(/[?&]fp-y=0\.5(?:&|$)/);
    expect(img.getAttribute('src')).not.toContain('crop=entropy');
    expect(img.getAttribute('srcset')).toMatch(/[?&]fp-x=0\.5(?:&|$)/);
    expect(img.getAttribute('srcset')).not.toContain('crop=entropy');
  });

  it('keeps a real hotspot as the focal point instead of the centre fallback', () => {
    setupWide({
      image: { ...wideImage, hotspot: { x: 0.2, y: 0.8, width: 1, height: 1 } },
    });

    const img = screen.getByRole('img', { name: wideImage.alt });
    expect(img.getAttribute('src')).toMatch(/[?&]fp-x=0\.2(?:&|$)/);
    expect(img.getAttribute('src')).toMatch(/[?&]fp-y=0\.8(?:&|$)/);
  });

  it('centres a hotspot-less focal point on the cropped area rather than the source when a crop is set', () => {
    setupWide({
      image: {
        ...wideImage,
        crop: { top: 0.1, bottom: 0, left: 0.2, right: 0 },
      },
    });

    const img = screen.getByRole('img', { name: wideImage.alt });
    expect(img.getAttribute('src')).toMatch(/[?&]fp-x=0\.5(?:&|$)/);
    expect(img.getAttribute('src')).toMatch(/[?&]fp-y=0\.5(?:&|$)/);
  });
});
