import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  testFallsBackToHeadingWithoutHero,
  testHeadingWithoutHero,
  testRendersAllowedModulesInOrder,
  testResolvedHero,
  testWarnsForUnknownModule,
} from '@web/testing/shared/module-renderer-contract/module-renderer-contract';
import type { ReactNode } from 'react';

import { PostIndexModuleRenderer } from './post-index-module-renderer';

const {
  ctaModuleMock,
  newsletterModuleMock,
  postFeaturedModuleMock,
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
  loggerWarnMock: vi.fn(),
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

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: loggerWarnMock,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const setup = customRenderAsync(PostIndexModuleRenderer, {
  hero: undefined,
  headingBlock: makeHeadingBlock({ heading: 'Notes on building things' }),
  modules: [],
  locale: 'en',
  tenant: 'tenant-1',
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
    unknownModule: { id: 'content-1', type: 'module_content' },
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
    ],
    expectedOrder: [
      'post-list-1',
      'taxonomy-list-1',
      'cta-1',
      'newsletter-1',
      'post-featured-1',
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
        locale: 'en',
        tenant: 'tenant-1',
        context: { page: 2 },
      },
      undefined,
    );
  });
});
