import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TagModuleRenderer } from './tag-module-renderer';

const {
  ctaModuleMock,
  newsletterModuleMock,
  postLatestModuleMock,
  postListModuleMock,
  heroModuleMock,
  heroBlogModuleMock,
  heroStatementModuleMock,
  loggerWarnMock,
} = vi.hoisted(() => ({
  ctaModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-cta">{id}</div>
  )),
  newsletterModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-newsletter">{id}</div>
  )),
  postLatestModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-post-latest">{id}</div>
  )),
  postListModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-post-list">{id}</div>
  )),
  heroModuleMock: vi.fn(async ({ id }: { id: string }) => (
    <h1 data-testid="stub-hero">{id}</h1>
  )),
  heroBlogModuleMock: vi.fn(async () => null),
  heroStatementModuleMock: vi.fn(async ({ id }: { id: string }) => (
    <h1 data-testid="stub-hero-statement">{id}</h1>
  )),
  loggerWarnMock: vi.fn(),
}));

vi.mock('@web/modules/cta/cta-module', () => ({ CtaModule: ctaModuleMock }));
vi.mock('@web/modules/newsletter/newsletter-module', () => ({
  NewsletterModule: newsletterModuleMock,
}));
vi.mock('@web/modules/post-latest/post-latest-module', () => ({
  PostLatestModule: postLatestModuleMock,
}));
vi.mock('@web/modules/post-list/post-list-module', () => ({
  PostListModule: postListModuleMock,
}));
vi.mock('@web/modules/hero/hero-module', () => ({
  HeroModule: heroModuleMock,
}));
vi.mock('@web/modules/hero-blog/hero-blog-module', () => ({
  HeroBlogModule: heroBlogModuleMock,
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

const setup = customRenderAsync(TagModuleRenderer, {
  hero: undefined,
  headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
  hasTrailingSpace: false,
  modules: [],
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TagModuleRenderer.name}/>`, () => {
  beforeEach(() => {
    ctaModuleMock.mockClear();
    newsletterModuleMock.mockClear();
    postLatestModuleMock.mockClear();
    postListModuleMock.mockClear();
    heroModuleMock.mockClear();
    heroBlogModuleMock.mockClear();
    heroStatementModuleMock.mockClear();
    loggerWarnMock.mockClear();
  });

  it('renders the page heading, with exactly one h1, when the page has no hero', async () => {
    await setup();

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('TypeScript');
  });

  it('renders the resolved hero, with exactly one h1, when the hero resolves to content', async () => {
    await setup({ hero: { id: 'hero-1', type: 'module_hero' } });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(screen.getByTestId('stub-hero')).toHaveTextContent('hero-1');
  });

  it('renders the resolved hero before the modules when the page has both', async () => {
    await setup({
      hero: { id: 'hero-1', type: 'module_hero' },
      modules: [
        { id: 'cta-1', type: 'module_cta' },
        { id: 'post-list-1', type: 'module_postList' },
      ],
    });

    const nodes = screen.getAllByTestId(/^stub-/);
    expect(nodes.map((node) => node.getAttribute('data-testid'))).toEqual([
      'stub-hero',
      'stub-cta',
      'stub-post-list',
    ]);
  });

  it('falls back to the page heading, still exactly one h1, when the hero resolves to nothing', async () => {
    await setup({ hero: { id: 'hero-2', type: 'module_heroBlog' } });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('TypeScript');
    expect(screen.queryByTestId('stub-hero')).not.toBeInTheDocument();
  });

  it('renders nothing and warns once for a module absent from the tag page allow-list', async () => {
    await setup({
      modules: [{ id: 'content-1', type: 'module_content' as never }],
    });

    expect(screen.queryByText('content-1')).not.toBeInTheDocument();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'module_renderer.unknown_module_type',
      { moduleType: 'module_content' },
    );
  });

  it('renders every allowed module keyed by its id, in the given order', async () => {
    await setup({
      modules: [
        { id: 'post-list-1', type: 'module_postList' },
        { id: 'post-latest-1', type: 'module_postLatest' },
        { id: 'cta-1', type: 'module_cta' },
        { id: 'newsletter-1', type: 'module_newsletter' },
      ],
    });

    const stubs = screen.getAllByTestId(/^stub-/);
    expect(stubs.map((node) => node.textContent)).toEqual([
      'post-list-1',
      'post-latest-1',
      'cta-1',
      'newsletter-1',
    ]);
  });
});
