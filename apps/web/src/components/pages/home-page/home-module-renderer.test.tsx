import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  testFeatureListModule,
  testHeadingWithoutHero,
  testHeroProfileHero,
  testRendersAllowedModulesInOrder,
  testTestimonialModule,
  testWarnsForUnknownModule,
} from '@web/testing/shared/module-renderer-contract/module-renderer-contract';

import { HomeModuleRenderer } from './home-module-renderer';

const {
  contentModuleMock,
  ctaModuleMock,
  newsletterModuleMock,
  postLatestModuleMock,
  taxonomyListModuleMock,
  postFeaturedModuleMock,
  featureListModuleMock,
  testimonialModuleMock,
  heroBlogModuleMock,
  heroProfileModuleMock,
  heroStatementModuleMock,
  loggerWarnMock,
} = vi.hoisted(() => ({
  contentModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-content">{id}</div>
  )),
  ctaModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-cta">{id}</div>
  )),
  newsletterModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-newsletter">{id}</div>
  )),
  postLatestModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-post-latest">{id}</div>
  )),
  taxonomyListModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-taxonomy-list">{id}</div>
  )),
  postFeaturedModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-post-featured">{id}</div>
  )),
  featureListModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-feature-list">{id}</div>
  )),
  testimonialModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-testimonial">{id}</div>
  )),
  heroBlogModuleMock: vi.fn(async () => null),
  heroProfileModuleMock: vi.fn(async ({ id }: { id: string }) => (
    <h1 data-testid="stub-hero-profile">{id}</h1>
  )),
  heroStatementModuleMock: vi.fn(async ({ id }: { id: string }) => (
    <h1 data-testid="stub-hero-statement">{id}</h1>
  )),
  loggerWarnMock: vi.fn(),
}));

vi.mock('@web/modules/content/content-module', () => ({
  ContentModule: contentModuleMock,
}));
vi.mock('@web/modules/cta/cta-module', () => ({ CtaModule: ctaModuleMock }));
vi.mock('@web/modules/newsletter/newsletter-module', () => ({
  NewsletterModule: newsletterModuleMock,
}));
vi.mock('@web/modules/post-latest/post-latest-module', () => ({
  PostLatestModule: postLatestModuleMock,
}));
vi.mock('@web/modules/taxonomy-list/taxonomy-list-module', () => ({
  TaxonomyListModule: taxonomyListModuleMock,
}));
vi.mock('@web/modules/post-featured/post-featured-module', () => ({
  PostFeaturedModule: postFeaturedModuleMock,
}));
vi.mock('@web/modules/feature-list/feature-list-module', () => ({
  FeatureListModule: featureListModuleMock,
}));
vi.mock('@web/modules/testimonial/testimonial-module', () => ({
  TestimonialModule: testimonialModuleMock,
}));
vi.mock('@web/modules/hero-blog/hero-blog-module', () => ({
  HeroBlogModule: heroBlogModuleMock,
}));
vi.mock('@web/modules/hero-profile/hero-profile-module', () => ({
  HeroProfileModule: heroProfileModuleMock,
}));
vi.mock('@web/modules/hero-statement/hero-statement-module', () => ({
  HeroStatementModule: heroStatementModuleMock,
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: loggerWarnMock,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const setup = customRenderAsync(HomeModuleRenderer, {
  hero: undefined,
  headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
  modules: [],
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${HomeModuleRenderer.name}/>`, () => {
  testHeadingWithoutHero({ setup, headingText: 'Welcome to the blog' });

  it('renders the resolved hero, with exactly one h1, when the hero resolves to content', async () => {
    await setup({ hero: { id: 'hero-1', type: 'module_heroStatement' } });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(screen.getByTestId('stub-hero-statement')).toHaveTextContent(
      'hero-1',
    );
  });

  it('renders the resolved hero before the modules when the page has both', async () => {
    await setup({
      hero: { id: 'hero-1', type: 'module_heroStatement' },
      modules: [
        { id: 'cta-1', type: 'module_cta' },
        { id: 'content-1', type: 'module_content' },
      ],
    });

    const nodes = screen.getAllByTestId(/^stub-/);
    expect(nodes.map((node) => node.getAttribute('data-testid'))).toEqual([
      'stub-hero-statement',
      'stub-cta',
      'stub-content',
    ]);
  });

  it('falls back to the page heading, still exactly one h1, when the hero resolves to nothing', async () => {
    await setup({ hero: { id: 'hero-2', type: 'module_heroBlog' } });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Welcome to the blog');
    expect(screen.queryByTestId('stub-hero')).not.toBeInTheDocument();
  });

  testHeroProfileHero({ setup, loggerWarnMock });

  testWarnsForUnknownModule({
    setup,
    loggerWarnMock,
    unknownModule: { id: 'post-list-1', type: 'module_postList' },
    description:
      'renders nothing and warns once for a module absent from the home page allow-list',
  });
  testFeatureListModule({ setup, loggerWarnMock });
  testTestimonialModule({ setup, loggerWarnMock });
  testRendersAllowedModulesInOrder({
    setup,
    modules: [
      { id: 'cta-1', type: 'module_cta' },
      { id: 'content-1', type: 'module_content' },
      { id: 'newsletter-1', type: 'module_newsletter' },
      { id: 'post-latest-1', type: 'module_postLatest' },
      { id: 'taxonomy-list-1', type: 'module_taxonomyList' },
      { id: 'post-featured-1', type: 'module_postFeatured' },
    ],
    expectedOrder: [
      'cta-1',
      'content-1',
      'newsletter-1',
      'post-latest-1',
      'taxonomy-list-1',
      'post-featured-1',
    ],
  });
});
