import { CONTENT_ALIGNMENT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import { customRenderAsync } from '@web/testing/custom-render';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_CTA_STUB_TEST_ID,
  MOCK_HERO_STUB_TEST_ID,
  MOCK_TAXONOMY_LIST_STUB_TEST_ID,
  mockModule,
} from '@web/testing/shared/module-renderer-contract/fixtures';
import {
  testFallsBackToHeadingWithoutHero,
  testHeadingWithoutHero,
  testHeroBeforeModules,
  testRendersAllowedModulesInOrder,
  testResolvedHero,
  testWarnsForUnknownModule,
} from '@web/testing/shared/module-renderer-contract/module-renderer-contract';
import { logger } from '@web/utils/logger/logger';

import { TopicIndexModuleRenderer } from './topic-index-module-renderer';

faker.seed(9052);

vi.mock('@web/modules/module-gate/module-gate');
vi.mock('@web/server/settings-features/is-module-entitled/is-module-entitled');

vi.mock('@web/modules/cta/cta-module');
vi.mock('@web/modules/newsletter/newsletter-module');
vi.mock('@web/modules/post-latest/post-latest-module');
vi.mock('@web/modules/taxonomy-list/taxonomy-list-module');
vi.mock('@web/modules/hero-blog/hero-blog-module');
vi.mock('@web/modules/content/content-module');

const loggerWarnMock = vi.mocked(logger.warn);

const MOCK_PAGE_HEADING = faker.lorem.sentence();

const setup = customRenderAsync(TopicIndexModuleRenderer, {
  hero: undefined,
  headingBlock: mockHeadingBlock({ heading: MOCK_PAGE_HEADING }),
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  modules: [],
});

describe(`<${TopicIndexModuleRenderer.name}/>`, () => {
  testHeadingWithoutHero({ setup, headingText: MOCK_PAGE_HEADING });
  testResolvedHero({ setup });
  testHeroBeforeModules({
    setup,
    modules: [mockModule('module_cta'), mockModule('module_taxonomyList')],
    expectedTestIds: [
      MOCK_HERO_STUB_TEST_ID,
      MOCK_CTA_STUB_TEST_ID,
      MOCK_TAXONOMY_LIST_STUB_TEST_ID,
    ],
  });
  testFallsBackToHeadingWithoutHero({
    setup,
    heroBlogModuleMock: vi.mocked(HeroBlogModule),
    headingText: MOCK_PAGE_HEADING,
  });
  testWarnsForUnknownModule({
    setup,
    loggerWarnMock,
    unknownModule: mockModule('module_stats'),
    description:
      'warns once and renders nothing for a module outside the topic index allow-list',
  });
  testRendersAllowedModulesInOrder({
    setup,
    modules: [
      mockModule('module_taxonomyList'),
      mockModule('module_postLatest'),
      mockModule('module_cta'),
      mockModule('module_newsletter'),
      mockModule('module_content'),
    ],
  });
});
