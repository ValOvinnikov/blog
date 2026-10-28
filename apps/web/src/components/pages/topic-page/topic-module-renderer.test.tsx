import { CONTENT_ALIGNMENT } from '@blog/config';
import { TAXONOMY_KIND } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { customRenderAsync } from '@web/testing/custom-render';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_FAQ_STUB_TEST_ID,
  mockModule,
} from '@web/testing/shared/module-renderer-contract/fixtures';
import {
  testChildrenBetweenHeroAndModules,
  testFallsBackToHeadingWithoutHero,
  testHeadingWithoutHero,
  testRendersAllowedModulesInOrder,
  testResolvedHero,
  testWarnsForUnknownModule,
} from '@web/testing/shared/module-renderer-contract/module-renderer-contract';
import { logger } from '@web/utils/logger/logger';

import { TopicModuleRenderer } from './topic-module-renderer';

faker.seed(1186);

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
const MOCK_CONTEXT = {
  page: faker.number.int({ min: 2, max: 9 }),
  archive: {
    id: faker.string.uuid(),
    kind: TAXONOMY_KIND.TOPICS,
    slug: faker.lorem.slug(),
    name: faker.lorem.word(),
  },
};

const setup = customRenderAsync(TopicModuleRenderer, {
  hero: undefined,
  headingBlock: mockHeadingBlock({ heading: MOCK_PAGE_HEADING }),
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  modules: [],
});

describe(`<${TopicModuleRenderer.name}/>`, () => {
  testHeadingWithoutHero({ setup, headingText: MOCK_PAGE_HEADING });
  testResolvedHero({ setup });
  testFallsBackToHeadingWithoutHero({
    setup,
    heroBlogModuleMock: vi.mocked(HeroBlogModule),
    headingText: MOCK_PAGE_HEADING,
  });
  testChildrenBetweenHeroAndModules({ setup });
  testWarnsForUnknownModule({
    setup,
    loggerWarnMock,
    unknownModule: mockModule('module_stats'),
    description:
      'warns once and renders nothing for a module outside the topic page allow-list',
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

  it('forwards the given context to the modules', async () => {
    const postListModule = mockModule('module_postList');

    await setup({ modules: [postListModule], context: MOCK_CONTEXT });

    expect(PostListModule).toHaveBeenCalledWith(
      { id: postListModule.id, context: MOCK_CONTEXT },
      undefined,
    );
  });
});
