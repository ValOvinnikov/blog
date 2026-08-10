import type { ISanityImage } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import { HeroModule } from './hero-module';

const sanityImage: ISanityImage = {
  assetId: 'image-abc123-1600x1200-jpg',
  alt: 'A scenic mountain range',
  hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
  crop: undefined,
  lqip: undefined,
  dimensions: { width: 1600, height: 1200, aspectRatio: 1600 / 1200 },
};

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
        sanityImage: undefined,
        primaryAction: undefined,
        secondaryAction: undefined,
        appearance: undefined,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to the blog' }),
    ).toBeVisible();
  });

  it('renders correctly when appearance.background is unset', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        eyebrow: undefined,
        title: 'Welcome to the blog',
        subtitle: undefined,
        sanityImage: undefined,
        primaryAction: undefined,
        secondaryAction: undefined,
        appearance: undefined,
      },
    });

    await setup();

    // Regression guard: `heroBackgroundVariants({ background: undefined })`
    // must not throw or drop the heading — the resulting background class is
    // presentation, covered by Storybook/manual check, not asserted here.
    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to the blog' }),
    ).toBeVisible();
  });

  it('renders the hero image cropped to a 16:9 (675) height, not 4:3 (900)', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        eyebrow: undefined,
        title: 'Welcome to the blog',
        subtitle: undefined,
        sanityImage,
        primaryAction: undefined,
        secondaryAction: undefined,
      },
    });

    await setup();

    const img = screen.getByRole('img', { name: sanityImage.alt });

    expect(img).toHaveAttribute('height', '675');
    expect(img.getAttribute('src')).toContain('h=675');
    expect(img.getAttribute('src')).not.toContain('h=900');
  });

  it('sets fetchpriority="high" on the hero image (confirmed LCP element)', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        eyebrow: undefined,
        title: 'Welcome to the blog',
        subtitle: undefined,
        sanityImage,
        primaryAction: undefined,
        secondaryAction: undefined,
      },
    });

    await setup();

    expect(screen.getByRole('img', { name: sanityImage.alt })).toHaveAttribute(
      'fetchpriority',
      'high',
    );
  });

  it('gives the default "Read more" CTA a descriptive accessible name via visually-hidden text', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        eyebrow: undefined,
        title: 'Welcome to the blog',
        subtitle: undefined,
        sanityImage: undefined,
        primaryAction: {
          label: 'Read more',
          href: '/blog/welcome-to-the-blog',
          target: undefined,
          hiddenLabelSuffix: 'Welcome to the blog',
        },
        secondaryAction: undefined,
      },
    });

    await setup();

    const link = screen.getByRole('link', {
      name: 'Read more: Welcome to the blog',
    });
    expect(link).toBeVisible();
    expect(link).toHaveTextContent('Read more: Welcome to the blog');
  });

  it('renders no hidden suffix when a custom (already-descriptive) label is authored', async () => {
    getHeroMock.mockResolvedValue({
      ok: true,
      data: {
        eyebrow: undefined,
        title: 'Welcome to the blog',
        subtitle: undefined,
        sanityImage: undefined,
        primaryAction: {
          label: 'Explore our latest stories',
          href: '/blog/welcome-to-the-blog',
          target: undefined,
          hiddenLabelSuffix: undefined,
        },
        secondaryAction: undefined,
      },
    });

    await setup();

    const link = screen.getByRole('link', {
      name: 'Explore our latest stories',
    });
    expect(link).toBeVisible();
    expect(link).toHaveTextContent('Explore our latest stories');
  });
});
