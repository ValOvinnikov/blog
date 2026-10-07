import { CONTENT_ALIGNMENT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  testFallsBackToHeadingWithoutHero,
  testHeadingWithoutHero,
  testRendersAllowedModulesInOrder,
  testResolvedHero,
  testWarnsForUnknownModule,
} from '@web/testing/shared/module-renderer-contract/module-renderer-contract';
import { logger } from '@web/utils/logger/logger';
import type { ReactNode } from 'react';

import { PostIndexModuleRenderer } from './post-index-module-renderer';

const {
  ctaModuleMock,
  newsletterModuleMock,
  postFeaturedModuleMock,
  postListModuleMock,
  taxonomyListModuleMock,
  heroBlogModuleMock,
  contentModuleMock,
  postLatestModuleMock,
} = vi.hoisted(() => ({
  postLatestModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-post-latest">{id}</div>
  )),
  contentModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-content">{id}</div>
  )),
  ctaModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-cta">{id}</div>
  )),
  newsletterModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-newsletter">{id}</div>
  )),
  postFeaturedModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-post-featured">{id}</div>
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
}));

vi.mock('@web/modules/cta/cta-module', () => ({ CtaModule: ctaModuleMock }));
vi.mock('@web/modules/newsletter/newsletter-module', () => ({
  NewsletterModule: newsletterModuleMock,
}));
vi.mock('@web/modules/post-featured/post-featured-module', () => ({
  PostFeaturedModule: postFeaturedModuleMock,
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

vi.mock('@web/modules/content/content-module', () => ({
  ContentModule: contentModuleMock,
}));

vi.mock('@web/modules/post-latest/post-latest-module', () => ({
  PostLatestModule: postLatestModuleMock,
}));

vi.mock('@web/utils/logger/logger');

const loggerWarnMock = vi.mocked(logger.warn);

const setup = customRenderAsync(PostIndexModuleRenderer, {
  hero: undefined,
  headingBlock: makeHeadingBlock({ heading: 'Notes on building things' }),
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  modules: [],
});

describe(`<${PostIndexModuleRenderer.name}/>`, () => {
  testHeadingWithoutHero({
    setup,
    headingText: 'Notes on building things',
  });
  testResolvedHero({ setup });
  testFallsBackToHeadingWithoutHero({
    setup,
    heroBlogModuleMock,
    headingText: 'Notes on building things',
  });

  it('renders the given children between the hero and the modules', async () => {
    await setup({
      hero: { id: 'hero-1', type: 'module_heroBlog' },
      modules: [{ id: 'cta-1', type: 'module_cta' }],
      children: <div data-testid="stub-topic-chips" />,
    });

    const nodes = screen.getAllByTestId(/^stub-/);
    expect(nodes.map((node) => node.getAttribute('data-testid'))).toEqual([
      'stub-hero',
      'stub-topic-chips',
      'stub-cta',
    ]);
  });

  testWarnsForUnknownModule({
    setup,
    loggerWarnMock,
    unknownModule: { id: 'stats-1', type: 'module_stats' },
    description:
      'renders nothing and warns once for a module absent from the post index allow-list',
  });
  testRendersAllowedModulesInOrder({
    setup,
    modules: [
      { id: 'post-list-1', type: 'module_postList' },
      { id: 'taxonomy-list-1', type: 'module_taxonomyList' },
      { id: 'cta-1', type: 'module_cta' },
      { id: 'newsletter-1', type: 'module_newsletter' },
      { id: 'post-featured-1', type: 'module_postFeatured' },
      { id: 'content-1', type: 'module_content' },
      { id: 'post-latest-1', type: 'module_postLatest' },
    ],
    expectedOrder: [
      'post-list-1',
      'taxonomy-list-1',
      'cta-1',
      'newsletter-1',
      'post-featured-1',
      'content-1',
      'post-latest-1',
    ],
  });

  it('forwards the given context to the modules', async () => {
    await setup({
      modules: [{ id: 'post-list-1', type: 'module_postList' }],
      context: { page: 2 },
    });

    expect(postListModuleMock).toHaveBeenCalledWith(
      {
        id: 'post-list-1',
        context: { page: 2 },
      },
      undefined,
    );
  });
});
