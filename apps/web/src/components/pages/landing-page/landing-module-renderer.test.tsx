import { customRenderAsync } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  testFallsBackToHeadingWithoutHero,
  testHeadingWithoutHero,
  testHeroBeforeModules,
  testHeroProfileHero,
  testRendersAllowedModulesInOrder,
  testResolvedHero,
  testWarnsForUnknownModule,
} from '@web/testing/shared/module-renderer-contract/module-renderer-contract';
import type { ReactNode } from 'react';

import { LandingModuleRenderer } from './landing-module-renderer';

const {
  contentModuleMock,
  ctaModuleMock,
  newsletterModuleMock,
  postLatestModuleMock,
  taxonomyListModuleMock,
  postFeaturedModuleMock,
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
  heroBlogModuleMock: vi.fn(
    async ({ id }: { id: string }): Promise<ReactNode> => (
      <h1 data-testid="stub-hero">{id}</h1>
    ),
  ),
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

const setup = customRenderAsync(LandingModuleRenderer, {
  hero: undefined,
  headingBlock: makeHeadingBlock({ heading: 'About Us' }),
  modules: [],
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${LandingModuleRenderer.name}/>`, () => {
  testHeadingWithoutHero({ setup, headingText: 'About Us' });
  testResolvedHero({ setup });
  testHeroBeforeModules({
    setup,
    modules: [
      { id: 'cta-1', type: 'module_cta' },
      { id: 'content-1', type: 'module_content' },
    ],
    expectedTestIds: ['stub-hero', 'stub-cta', 'stub-content'],
  });
  testFallsBackToHeadingWithoutHero({
    setup,
    heroBlogModuleMock,
    headingText: 'About Us',
  });
  testHeroProfileHero({ setup, loggerWarnMock });
  testWarnsForUnknownModule({
    setup,
    loggerWarnMock,
    unknownModule: { id: 'post-list-1', type: 'module_postList' },
    description:
      'renders nothing and warns once for a module absent from the landing page allow-list',
  });
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
