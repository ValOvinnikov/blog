import { CONTENT_ALIGNMENT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { CtaModule } from '@web/modules/cta/cta-module';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_CONTENT_STUB_TEST_ID,
  MOCK_CTA_STUB_TEST_ID,
  MOCK_FEATURE_LIST_STUB_TEST_ID,
  MOCK_HERO_PROFILE_STUB_TEST_ID,
  MOCK_HERO_STATEMENT_STUB_TEST_ID,
  MOCK_HERO_STUB_TEST_ID,
  MOCK_TESTIMONIAL_STUB_TEST_ID,
  mockModule,
} from '@web/testing/shared/module-renderer-contract/fixtures';
import {
  testFallsBackToHeadingWithoutHero,
  testFeatureListModule,
  testHeadingWithoutHero,
  testHeroBeforeModules,
  testHeroProfileHero,
  testRendersAllowedModulesInOrder,
  testResolvedHero,
  testTestimonialModule,
  testWarnsForUnknownModule,
} from '@web/testing/shared/module-renderer-contract/module-renderer-contract';
import { logger } from '@web/utils/logger/logger';

import { HomeModuleRenderer } from './home-module-renderer';

faker.seed(3917);

vi.mock('@web/modules/module-gate/module-gate');
vi.mock('@web/server/settings-features/is-module-entitled/is-module-entitled');

vi.mock('@web/modules/content/content-module');
vi.mock('@web/modules/cta/cta-module');
vi.mock('@web/modules/newsletter/newsletter-module');
vi.mock('@web/modules/post-latest/post-latest-module');
vi.mock('@web/modules/taxonomy-list/taxonomy-list-module');
vi.mock('@web/modules/post-featured/post-featured-module');
vi.mock('@web/modules/hero-blog/hero-blog-module');
vi.mock('@web/modules/feature-list/feature-list-module', () => ({
  FeatureListModule: vi.fn(({ id }: TModuleComponentProps) => (
    <div data-testid={MOCK_FEATURE_LIST_STUB_TEST_ID}>{id}</div>
  )),
}));
vi.mock('@web/modules/testimonial/testimonial-module', () => ({
  TestimonialModule: vi.fn(({ id }: TModuleComponentProps) => (
    <div data-testid={MOCK_TESTIMONIAL_STUB_TEST_ID}>{id}</div>
  )),
}));
vi.mock('@web/modules/hero-profile/hero-profile-module', () => ({
  HeroProfileModule: vi.fn(async ({ id }: TModuleComponentProps) => (
    <h1 data-testid={MOCK_HERO_PROFILE_STUB_TEST_ID}>{id}</h1>
  )),
}));
vi.mock('@web/modules/hero-statement/hero-statement-module', () => ({
  HeroStatementModule: vi.fn(async ({ id }: TModuleComponentProps) => (
    <h1 data-testid={MOCK_HERO_STATEMENT_STUB_TEST_ID}>{id}</h1>
  )),
}));

const loggerWarnMock = vi.mocked(logger.warn);

const MOCK_PAGE_HEADING = faker.lorem.sentence();
const MOCK_HOME_PAGE_ID = faker.string.uuid();

const setup = customRenderAsync(HomeModuleRenderer, {
  homePageId: MOCK_HOME_PAGE_ID,
  hero: undefined,
  headingBlock: mockHeadingBlock({ heading: MOCK_PAGE_HEADING }),
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  modules: [],
});

describe(`<${HomeModuleRenderer.name}/>`, () => {
  testHeadingWithoutHero({ setup, headingText: MOCK_PAGE_HEADING });
  testResolvedHero({ setup });
  testHeroBeforeModules({
    setup,
    modules: [mockModule('module_cta'), mockModule('module_content')],
    expectedTestIds: [
      MOCK_HERO_STUB_TEST_ID,
      MOCK_CTA_STUB_TEST_ID,
      MOCK_CONTENT_STUB_TEST_ID,
    ],
  });
  testFallsBackToHeadingWithoutHero({
    setup,
    heroBlogModuleMock: vi.mocked(HeroBlogModule),
    headingText: MOCK_PAGE_HEADING,
  });
  testHeroProfileHero({ setup, loggerWarnMock });
  testFeatureListModule({ setup, loggerWarnMock });
  testTestimonialModule({ setup, loggerWarnMock });

  it('renders a module_heroStatement hero via the map', async () => {
    const hero = mockModule('module_heroStatement');

    await setup({ hero });

    const heroStatement = screen.getByTestId(MOCK_HERO_STATEMENT_STUB_TEST_ID);

    expect(heroStatement).toBeVisible();
    expect(heroStatement).toHaveTextContent(hero.id);
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });

  it('renders each module with the home page as its context', async () => {
    const ctaModule = mockModule('module_cta');

    await setup({ modules: [ctaModule] });

    expect(CtaModule).toHaveBeenCalledWith(
      {
        id: ctaModule.id,
        context: { homePage: { id: MOCK_HOME_PAGE_ID } },
      },
      undefined,
    );
  });

  testWarnsForUnknownModule({
    setup,
    loggerWarnMock,
    unknownModule: mockModule('module_postList'),
    description:
      'warns once and renders nothing for a module outside the home allow-list',
  });
  testRendersAllowedModulesInOrder({
    setup,
    modules: [
      mockModule('module_cta'),
      mockModule('module_content'),
      mockModule('module_newsletter'),
      mockModule('module_postLatest'),
      mockModule('module_taxonomyList'),
      mockModule('module_postFeatured'),
    ],
  });
});
