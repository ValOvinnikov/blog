import { CONTENT_ALIGNMENT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { HeroBlogModule } from '@web/modules/hero-blog/hero-blog-module';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { customRenderAsync } from '@web/testing/custom-render';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockModule } from '@web/testing/shared/module-renderer-contract/fixtures';
import {
  testChildrenBetweenHeroAndModules,
  testFallsBackToHeadingWithoutHero,
  testHeadingWithoutHero,
  testRendersAllowedModulesInOrder,
  testResolvedHero,
  testWarnsForUnknownModule,
} from '@web/testing/shared/module-renderer-contract/module-renderer-contract';
import { logger } from '@web/utils/logger/logger';

import { PostIndexModuleRenderer } from './post-index-module-renderer';

faker.seed(2718);

vi.mock('@web/modules/cta/cta-module');
vi.mock('@web/modules/newsletter/newsletter-module');
vi.mock('@web/modules/post-featured/post-featured-module');
vi.mock('@web/modules/post-list/post-list-module');
vi.mock('@web/modules/taxonomy-list/taxonomy-list-module');
vi.mock('@web/modules/hero-blog/hero-blog-module');
vi.mock('@web/modules/content/content-module');
vi.mock('@web/modules/post-latest/post-latest-module');

const loggerWarnMock = vi.mocked(logger.warn);

const MOCK_PAGE_HEADING = faker.lorem.sentence();
const MOCK_PAGE_NUMBER = faker.number.int({ min: 2, max: 9 });

const setup = customRenderAsync(PostIndexModuleRenderer, {
  hero: undefined,
  headingBlock: mockHeadingBlock({ heading: MOCK_PAGE_HEADING }),
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  modules: [],
});

describe(`<${PostIndexModuleRenderer.name}/>`, () => {
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
      'warns once and renders nothing for a module outside the post index allow-list',
  });
  testRendersAllowedModulesInOrder({
    setup,
    modules: [
      mockModule('module_postList'),
      mockModule('module_taxonomyList'),
      mockModule('module_cta'),
      mockModule('module_newsletter'),
      mockModule('module_postFeatured'),
      mockModule('module_content'),
      mockModule('module_postLatest'),
    ],
  });

  it('forwards the given context to the modules', async () => {
    const postListModule = mockModule('module_postList');

    await setup({
      modules: [postListModule],
      context: { page: MOCK_PAGE_NUMBER },
    });

    expect(PostListModule).toHaveBeenCalledWith(
      { id: postListModule.id, context: { page: MOCK_PAGE_NUMBER } },
      undefined,
    );
  });
});
