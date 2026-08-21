import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroModule } from './hero-module';

const { getHeroMock } = vi.hoisted(() => ({
  getHeroMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  getSanityImageBaseUrl: () =>
    'https://cdn.sanity.io/images/test-project/test-dataset/',
  service: {
    modules: {
      hero: { v1: { getHero: getHeroMock } },
    },
  },
}));

const setup = customRenderAsync(HeroModule, { id: 'hero-1', locale: 'en' });

describe(HeroModule, () => {
  beforeEach(() => {
    getHeroMock.mockReset();
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no title resolves (POST mode, no configured or fallback featured post)', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        eyebrow: undefined,
        title: undefined,
        subtitle: undefined,
        sanityImage: undefined,
        primaryAction: undefined,
        secondaryAction: undefined,
        layout: undefined,
      },
    });

    const { container } = await setup();

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("resolves baseUrl via getSanityImageBaseUrl and forwards it into the rendered hero image's src", async () => {
    const sanityImage = makeSanityImage();
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        eyebrow: undefined,
        title: 'Welcome to the blog',
        subtitle: undefined,
        sanityImage,
        primaryAction: undefined,
        secondaryAction: undefined,
        layout: undefined,
      },
    });

    await setup();

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img.getAttribute('src')).toContain('test-project/test-dataset');
  });
});
