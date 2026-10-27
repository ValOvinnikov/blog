import type { ISanityImage } from '@blog/config';
import { faker } from '@faker-js/faker';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';

import { SanityImage } from './sanity-image';

faker.seed(6007);

const MOCK_IMAGE = mockSanityImage({ alt: faker.lorem.words(3) });
const MOCK_WIDE_IMAGE = mockSanityImage({
  alt: faker.lorem.words(3),
  hotspot: undefined,
});
const MOCK_OTHER_PROJECT_PATH = `${faker.word.noun()}/${faker.word.noun()}`;
const MOCK_OTHER_BASE_URL = `https://cdn.sanity.io/images/${MOCK_OTHER_PROJECT_PATH}/`;
const MOCK_ALT = faker.lorem.words(2);
const MOCK_SIZES = '(min-width: 1024px) 50vw, 100vw';
const MOCK_LQIP = 'data:image/webp;base64,fake';
const ENTROPY_CROP = 'crop=entropy';

const focalParamPattern = (param: string) =>
  new RegExp(`[?&]fp-${param.replace(/\./, '\\.')}(?:&|$)`);

const focalParams = (x: number, y: number) => ({
  x: focalParamPattern(`x=${x}`),
  y: focalParamPattern(`y=${y}`),
});

const setup = customRender(SanityImage, {
  image: MOCK_IMAGE,
  width: 960,
  height: 720,
});

const setupWide = customRender(SanityImage, {
  image: MOCK_WIDE_IMAGE,
  width: 800,
  height: 600,
});

describe(`<${SanityImage.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the src and srcset against the default base URL', () => {
      const img = screen.getByRole('img', { name: MOCK_IMAGE.alt });

      expect(img.getAttribute('src')).toContain(STATIC_SANITY_IMAGE_BASE_URL);
      expect(img.getAttribute('srcset')).toContain(
        STATIC_SANITY_IMAGE_BASE_URL,
      );
    });

    it('renders no fetchpriority attribute when priority is omitted', () => {
      const img = screen.getByRole('img', { name: MOCK_IMAGE.alt });

      expect(img).not.toHaveAttribute('fetchpriority');
    });
  });

  it('renders against the base URL of the surrounding provider', () => {
    renderElement(
      <SanityImageBaseUrlProvider baseUrl={MOCK_OTHER_BASE_URL}>
        <SanityImage image={MOCK_IMAGE} width={960} height={720} />
      </SanityImageBaseUrlProvider>,
    );

    const img = screen.getByRole('img', { name: MOCK_IMAGE.alt });

    expect(img.getAttribute('src')).toContain(MOCK_OTHER_PROJECT_PATH);
    expect(img.getAttribute('srcset')).toContain(MOCK_OTHER_PROJECT_PATH);
  });

  it('names the image by the provided alt override', () => {
    setup({ alt: MOCK_ALT });

    const overridden = screen.getByRole('img', { name: MOCK_ALT });
    const original = screen.queryByRole('img', { name: MOCK_IMAGE.alt });

    expect(overridden).toBeVisible();
    expect(original).not.toBeInTheDocument();
  });

  it('forwards sizes and loading to the rendered element', () => {
    setup({ sizes: MOCK_SIZES, loading: 'lazy' });

    const img = screen.getByRole('img', { name: MOCK_IMAGE.alt });

    expect(img).toHaveAttribute('sizes', MOCK_SIZES);
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('marks a priority image as high fetch priority', () => {
    setup({ priority: true });

    const img = screen.getByRole('img', { name: MOCK_IMAGE.alt });

    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('renders a priority image as a single img with no LQIP placeholder', () => {
    setup({ priority: true, image: { ...MOCK_IMAGE, lqip: MOCK_LQIP } });

    const images = screen.getAllByRole('img', { name: MOCK_IMAGE.alt });
    const placeholder = screen.queryByRole('presentation');

    expect(images).toHaveLength(1);
    expect(placeholder).not.toBeInTheDocument();
  });

  it('renders a hidden LQIP placeholder for a non-priority image with a preview', () => {
    setup({ image: { ...MOCK_IMAGE, lqip: MOCK_LQIP } });

    const img = screen.getByRole('img', { name: MOCK_IMAGE.alt });
    const placeholder = screen.getByRole('presentation');

    expect(img).toBeVisible();
    expect(placeholder).not.toBeVisible();
  });

  it('crops a hotspot-less cover image by its centre, never by entropy', () => {
    setupWide();

    const img = screen.getByRole('img', { name: MOCK_WIDE_IMAGE.alt });
    const src = img.getAttribute('src');
    const srcset = img.getAttribute('srcset');

    expect(src).not.toContain(ENTROPY_CROP);
    expect(srcset).toMatch(focalParams(0.5, 0.5).x);
    expect(srcset).not.toContain(ENTROPY_CROP);
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
      setupWide({ image: { ...MOCK_WIDE_IMAGE, ...imageOverrides } });

      const img = screen.getByRole('img', { name: MOCK_WIDE_IMAGE.alt });
      const src = img.getAttribute('src');
      const focal = focalParams(x, y);

      expect(src).toMatch(focal.x);
      expect(src).toMatch(focal.y);
    },
  );
});
