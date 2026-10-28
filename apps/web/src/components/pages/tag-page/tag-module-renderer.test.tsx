import { CONTENT_ALIGNMENT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { customRenderAsync } from '@web/testing/custom-render';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_CTA_STUB_TEST_ID,
  MOCK_FAQ_STUB_TEST_ID,
  MOCK_HERO_STUB_TEST_ID,
  MOCK_POST_LIST_STUB_TEST_ID,
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

import { TagModuleRenderer } from './tag-module-renderer';

faker.seed(7731);

vi.mock('@web/modules/module-gate/module-gate');
vi.mock('@web/server/settings-features/is-module-entitled/is-module-entitled');

vi.mock('@web/modules/cta/cta-module');
vi.mock('@web/modules/newsletter/newsletter-module');
vi.mock('@web/modules/post-latest/post-latest-module');
vi.mock('@web/modules/post-list/post-list-module');
vi.mock('@web/modules/taxonomy-list/taxonomy-list-module');
vi.mock('@web/modules/hero-blog/hero-blog-module');
vi.mock('@web/modules/content/content-module');
vi.mock('@web/modules/faq/faq-module', () => ({
  FaqModule: vi.fn(({ id }: TModuleComponentProps) => (
    <div data-testid={MOCK_FAQ_STUB_TEST_ID}>{id}</div>
  )),
}));

const loggerWarnMock = vi.mocked(logger.warn);

const MOCK_PAGE_HEADING = faker.lorem.sentence();

const setup = customRenderAsync(TagModuleRenderer, {
  hero: undefined,
  headingBlock: mockHeadingBlock({ heading: MOCK_PAGE_HEADING }),
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  modules: [],
});

describe(`<${TagModuleRenderer.name}/>`, () => {
  testHeadingWithoutHero({ setup, headingText: MOCK_PAGE_HEADING });
  testResolvedHero({ setup });
  testHeroBeforeModules({
    setup,
    modules: [mockModule('module_cta'), mockModule('module_postList')],
    expectedTestIds: [
      MOCK_HERO_STUB_TEST_ID,
      MOCK_CTA_STUB_TEST_ID,
      MOCK_POST_LIST_STUB_TEST_ID,
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
      'warns once and renders nothing for a module outside the tag page allow-list',
  });
  testRendersAllowedModulesInOrder({
    setup,
    modules: [
      mockModule('module_postList'),
      mockModule('module_postLatest'),
      mockModule('module_taxonomyList'),
      mockModule('module_cta'),
      mockModule('module_newsletter'),
      mockModule('module_content'),
      mockModule('module_faq'),
    ],
  });
});
