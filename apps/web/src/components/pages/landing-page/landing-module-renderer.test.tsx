import { CONTENT_ALIGNMENT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { SectionPagesModule } from '@web/modules/section-pages/section-pages-module';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_CONTENT_STUB_TEST_ID,
  MOCK_CTA_STUB_TEST_ID,
  MOCK_FEATURE_LIST_STUB_TEST_ID,
  MOCK_HERO_PROFILE_STUB_TEST_ID,
  MOCK_HERO_STUB_TEST_ID,
  MOCK_SECTION_PAGES_STUB_TEST_ID,
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

import { LandingModuleRenderer } from './landing-module-renderer';

faker.seed(6204);

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
vi.mock('@web/modules/section-pages/section-pages-module', () => ({
  SectionPagesModule: vi.fn(({ id }: TModuleComponentProps) => (
    <div data-testid={MOCK_SECTION_PAGES_STUB_TEST_ID}>{id}</div>
  )),
}));

const loggerWarnMock = vi.mocked(logger.warn);

const MOCK_PAGE_HEADING = faker.lorem.sentence();
const MOCK_LANDING_PAGE = {
  id: faker.string.uuid(),
  path: faker.lorem.slug(),
};

const setup = customRenderAsync(LandingModuleRenderer, {
  hero: undefined,
  headingBlock: mockHeadingBlock({ heading: MOCK_PAGE_HEADING }),
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  modules: [],
  landingPage: MOCK_LANDING_PAGE,
});

describe(`<${LandingModuleRenderer.name}/>`, () => {
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
  testWarnsForUnknownModule({
    setup,
    loggerWarnMock,
    unknownModule: mockModule('module_postList'),
    description:
      'warns once and renders nothing for a module outside the landing allow-list',
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

  it('renders the section pages module with the landing page as its context', async () => {
    const sectionPagesModule = mockModule('module_sectionPages');

    await setup({ modules: [sectionPagesModule] });

    const sectionPages = screen.getByTestId(MOCK_SECTION_PAGES_STUB_TEST_ID);

    expect(sectionPages).toHaveTextContent(sectionPagesModule.id);
    expect(SectionPagesModule).toHaveBeenCalledWith(
      {
        id: sectionPagesModule.id,
        context: { landingPage: MOCK_LANDING_PAGE },
      },
      undefined,
    );
  });
});
