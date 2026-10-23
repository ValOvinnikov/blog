import type { ISanityImage } from '@blog/config';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { MOCK_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';

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

const OTHER_PROJECT_PATH = 'other-project/other-dataset';
const OTHER_BASE_URL = `https://cdn.sanity.io/images/${OTHER_PROJECT_PATH}/`;
const CUSTOM_ALT = 'Custom alt';
const SIZES = '(min-width: 1024px) 50vw, 100vw';
const LQIP = 'data:image/webp;base64,fake';
const ENTROPY_CROP = 'crop=entropy';

const focalParamPattern = (param: string) =>
  new RegExp(`[?&]fp-${param.replace(/\./, '\\.')}(?:&|$)`);

const focalParams = (x: number, y: number) => ({
  x: focalParamPattern(`x=${x}`),
  y: focalParamPattern(`y=${y}`),
});

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
    let img: HTMLElement;

    beforeEach(() => {
      setup();
      img = screen.getByRole('img', { name: image.alt });
    });

    it('renders the src and srcset against the default base URL', () => {
      expect(img.getAttribute('src')).toContain(MOCK_SANITY_IMAGE_BASE_URL);
      expect(img.getAttribute('srcset')).toContain(MOCK_SANITY_IMAGE_BASE_URL);
    });

    it('renders no fetchpriority attribute when priority is omitted', () => {
      expect(img).not.toHaveAttribute('fetchpriority');
    });
  });

  it('renders against the base URL of the surrounding provider', () => {
    renderElement(
      <SanityImageBaseUrlProvider baseUrl={OTHER_BASE_URL}>
        <SanityImage image={image} width={960} height={720} />
      </SanityImageBaseUrlProvider>,
    );

    const img = screen.getByRole('img', { name: image.alt });
    expect(img.getAttribute('src')).toContain(OTHER_PROJECT_PATH);
    expect(img.getAttribute('srcset')).toContain(OTHER_PROJECT_PATH);
  });

  it('uses the provided alt override instead of the image alt', () => {
    setup({ alt: CUSTOM_ALT });

    const overridden = screen.getByAltText(CUSTOM_ALT);
    const original = screen.queryByAltText(image.alt);
    expect(overridden).toBeVisible();
    expect(original).not.toBeInTheDocument();
  });

  it('forwards sizes and loading to the rendered element', () => {
    setup({
      sizes: SIZES,
      loading: 'eager',
    });

    const img = screen.getByRole('img', { name: image.alt });
    expect(img).toHaveAttribute('sizes', SIZES);
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('sets fetchpriority="high" on the rendered img when priority is true', () => {
    setup({ priority: true });

    const img = screen.getByRole('img', { name: image.alt });
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('renders a priority image as a single img with no LQIP placeholder', () => {
    setup({
      priority: true,
      image: { ...image, lqip: LQIP },
    });

    const images = screen.getAllByRole('img', { name: image.alt });
    expect(images).toHaveLength(1);
    expect(images[0]).not.toHaveAttribute('data-lqip');
    expect(images[0]?.getAttribute('src')).toContain(
      MOCK_SANITY_IMAGE_BASE_URL,
    );
  });

  it('renders a hidden LQIP placeholder for a non-priority image with a preview', () => {
    setup({
      image: { ...image, lqip: LQIP },
    });

    const img = screen.getByRole('img', { name: image.alt });
    const placeholder = screen.getByRole('presentation');
    expect(img).toBeVisible();
    expect(placeholder).not.toBeVisible();
  });

  it('crops a hotspot-less cover image by its centre, never by entropy', () => {
    setupWide();

    const img = screen.getByRole('img', { name: wideImage.alt });
    expect(img.getAttribute('src')).not.toContain(ENTROPY_CROP);
    expect(img.getAttribute('srcset')).toMatch(focalParams(0.5, 0.5).x);
    expect(img.getAttribute('srcset')).not.toContain(ENTROPY_CROP);
  });

  it.each([
    ['the centre for a hotspot-less image', {}, 0.5, 0.5],
    [
      'a real hotspot',
      { hotspot: { x: 0.2, y: 0.8, width: 1, height: 1 } },
      0.2,
      0.8,
    ],
    [
      'the centre of the cropped area when a crop is set',
      { crop: { top: 0.1, bottom: 0, left: 0.2, right: 0 } },
      0.5,
      0.5,
    ],
  ] satisfies [string, Partial<ISanityImage>, number, number][])(
    'uses %s as the focal point',
    (_case, imageOverrides, x, y) => {
      setupWide({ image: { ...wideImage, ...imageOverrides } });

      const src = screen
        .getByRole('img', { name: wideImage.alt })
        .getAttribute('src');
      const focal = focalParams(x, y);
      expect(src).toMatch(focal.x);
      expect(src).toMatch(focal.y);
    },
  );
});
