import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import type { ReactNode } from 'react';

import { TopicModuleRenderer } from './topic-module-renderer';

const {
  ctaModuleMock,
  newsletterModuleMock,
  postLatestModuleMock,
  postListModuleMock,
  taxonomyListModuleMock,
  heroBlogModuleMock,
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
  taxonomyListModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-taxonomy-list">{id}</div>
  )),
  heroBlogModuleMock: vi.fn(
    async ({ id }: { id: string }): Promise<ReactNode> => (
      <h1 data-testid="stub-hero">{id}</h1>
    ),
  ),
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
vi.mock('@web/modules/taxonomy-list/taxonomy-list-module', () => ({
  TaxonomyListModule: taxonomyListModuleMock,
}));
vi.mock('@web/modules/hero-blog/hero-blog-module', () => ({
  HeroBlogModule: heroBlogModuleMock,
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: loggerWarnMock,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const setup = customRenderAsync(TopicModuleRenderer, {
  hero: undefined,
  headingBlock: makeHeadingBlock({ heading: 'News' }),
  modules: [],
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TopicModuleRenderer.name}/>`, () => {
  it('renders the page heading, with exactly one h1, when the page has no hero', async () => {
    await setup();

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('News');
  });

  it('renders the resolved hero, with exactly one h1, when the hero resolves to content', async () => {
    await setup({ hero: { id: 'hero-1', type: 'module_heroBlog' } });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(screen.getByTestId('stub-hero')).toHaveTextContent('hero-1');
  });

  it('falls back to the page heading, still exactly one h1, when the hero resolves to nothing', async () => {
    heroBlogModuleMock.mockResolvedValueOnce(null);

    await setup({ hero: { id: 'hero-2', type: 'module_heroBlog' } });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('News');
    expect(screen.queryByTestId('stub-hero')).not.toBeInTheDocument();
  });

  it('renders the given children between the hero and the modules', async () => {
    await setup({
      hero: { id: 'hero-1', type: 'module_heroBlog' },
      modules: [{ id: 'cta-1', type: 'module_cta' }],
      children: <div data-testid="stub-children">chips</div>,
    });

    const nodes = screen.getAllByTestId(/^stub-/);
    expect(nodes.map((node) => node.getAttribute('data-testid'))).toEqual([
      'stub-hero',
      'stub-children',
      'stub-cta',
    ]);
  });

  it('renders nothing and warns once for a module absent from the topic page allow-list', async () => {
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
        { id: 'taxonomy-list-1', type: 'module_taxonomyList' },
        { id: 'cta-1', type: 'module_cta' },
        { id: 'newsletter-1', type: 'module_newsletter' },
      ],
    });

    const stubs = screen.getAllByTestId(/^stub-/);
    expect(stubs.map((node) => node.textContent)).toEqual([
      'post-list-1',
      'post-latest-1',
      'taxonomy-list-1',
      'cta-1',
      'newsletter-1',
    ]);
  });

  it('forwards the given context to the modules', async () => {
    await setup({
      modules: [{ id: 'post-list-1', type: 'module_postList' }],
      context: {
        page: 2,
        archive: { kind: 'TOPICS', slug: 'news', name: 'News' },
      },
    });

    expect(postListModuleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'post-list-1',
        context: {
          page: 2,
          archive: { kind: 'TOPICS', slug: 'news', name: 'News' },
        },
      }),
      undefined,
    );
  });
});
