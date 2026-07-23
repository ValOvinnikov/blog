import { customRenderAsync, screen } from '@web/testing/custom-render';

import { HeroModule } from './hero-module';

const { getHeroMock } = vi.hoisted(() => ({
  getHeroMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
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

  it('renders no top-level heading when the fetch fails', async () => {
    getHeroMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders no top-level heading when no title resolves (POST mode, no configured or fallback featured post)', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        eyebrow: undefined,
        title: undefined,
        subtitle: undefined,
        image: undefined,
        sanityImage: undefined,
        primaryAction: undefined,
        secondaryAction: undefined,
      },
    });

    const { container } = await setup();

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved title as the top-level heading', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        eyebrow: undefined,
        title: 'Welcome to the blog',
        subtitle: undefined,
        image: undefined,
        sanityImage: undefined,
        primaryAction: undefined,
        secondaryAction: undefined,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to the blog' }),
    ).toBeVisible();
  });
});
