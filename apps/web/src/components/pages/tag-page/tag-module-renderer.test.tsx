import { customRenderAsync } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  testFallsBackToHeadingWithoutHero,
  testHeadingWithoutHero,
  testHeroBeforeModules,
  testRendersAllowedModulesInOrder,
  testResolvedHero,
  testWarnsForUnknownModule,
} from '@web/testing/shared/module-renderer-contract/module-renderer-contract';
import type { ReactNode } from 'react';

import { TagModuleRenderer } from './tag-module-renderer';

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

const setup = customRenderAsync(TagModuleRenderer, {
  hero: undefined,
  headingBlock: makeHeadingBlock({ heading: 'TypeScript' }),
  hasTrailingSpace: false,
  modules: [],
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${TagModuleRenderer.name}/>`, () => {
  testHeadingWithoutHero({ setup, headingText: 'TypeScript' });
  testResolvedHero({ setup });
  testHeroBeforeModules({
    setup,
    modules: [
      { id: 'cta-1', type: 'module_cta' },
      { id: 'post-list-1', type: 'module_postList' },
    ],
    expectedTestIds: ['stub-hero', 'stub-cta', 'stub-post-list'],
  });
  testFallsBackToHeadingWithoutHero({
    setup,
    heroBlogModuleMock,
    headingText: 'TypeScript',
  });
  testWarnsForUnknownModule({
    setup,
    loggerWarnMock,
    unknownModule: { id: 'content-1', type: 'module_content' },
    description:
      'renders nothing and warns once for a module absent from the tag page allow-list',
  });
  testRendersAllowedModulesInOrder({
    setup,
    modules: [
      { id: 'post-list-1', type: 'module_postList' },
      { id: 'post-latest-1', type: 'module_postLatest' },
      { id: 'taxonomy-list-1', type: 'module_taxonomyList' },
      { id: 'cta-1', type: 'module_cta' },
      { id: 'newsletter-1', type: 'module_newsletter' },
    ],
    expectedOrder: [
      'post-list-1',
      'post-latest-1',
      'taxonomy-list-1',
      'cta-1',
      'newsletter-1',
    ],
  });
});
