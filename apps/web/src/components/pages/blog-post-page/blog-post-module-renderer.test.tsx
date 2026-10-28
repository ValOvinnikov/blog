import type { TPagePostType } from '@blog/config';
import type { TModule } from '@blog/service';
import { faker } from '@faker-js/faker';
import { MODULE_RENDERER_LOG } from '@web/constants/module-renderer';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_STUB_TEST_ID,
  MOCK_NEWSLETTER_STUB_TEST_ID,
  MOCK_POST_LATEST_STUB_TEST_ID,
  MOCK_POST_RELATED_STUB_TEST_ID,
  MOCK_TAXONOMY_LIST_STUB_TEST_ID,
  mockModule,
} from '@web/testing/shared/module-renderer-contract/fixtures';
import { logger } from '@web/utils/logger/logger';

import { BlogPostModuleRenderer } from './blog-post-module-renderer';

faker.seed(8143);

vi.mock('@web/modules/module-gate/module-gate');
vi.mock('@web/server/settings-features/is-module-entitled/is-module-entitled');

vi.mock('@web/modules/cta/cta-module');
vi.mock('@web/modules/newsletter/newsletter-module');
vi.mock('@web/modules/post-latest/post-latest-module');
vi.mock('@web/modules/taxonomy-list/taxonomy-list-module');
vi.mock('@web/modules/post-related/post-related-module', () => ({
  PostRelatedModule: vi.fn(({ id, context }: TModuleComponentProps) => (
    <div data-testid={MOCK_POST_RELATED_STUB_TEST_ID}>
      {id}:{context?.post?.id}
    </div>
  )),
}));

const MOCK_POST_ID = faker.string.uuid();
const MOCK_UNKNOWN_MODULE_TYPE = 'module_hero';

const setup = customRender(BlogPostModuleRenderer, {
  modules: [] as TModule<TPagePostType>[],
});

describe(`<${BlogPostModuleRenderer.name}/>`, () => {
  it('renders every allowed module, in the given order', () => {
    setup({
      modules: [
        mockModule('module_postRelated'),
        mockModule('module_newsletter'),
        mockModule('module_cta'),
        mockModule('module_postLatest'),
        mockModule('module_taxonomyList'),
      ],
    });

    const stubs = screen.getAllByTestId(/^stub-/);
    const stubTestIds = stubs.map((stub) => stub.getAttribute('data-testid'));

    expect(stubTestIds).toEqual([
      MOCK_POST_RELATED_STUB_TEST_ID,
      MOCK_NEWSLETTER_STUB_TEST_ID,
      MOCK_CTA_STUB_TEST_ID,
      MOCK_POST_LATEST_STUB_TEST_ID,
      MOCK_TAXONOMY_LIST_STUB_TEST_ID,
    ]);
  });

  it('warns once and renders nothing for a module outside the allow-list', () => {
    const unknownModule = mockModule(MOCK_UNKNOWN_MODULE_TYPE);

    // @ts-expect-error -- module_hero is not in the post page allow-list
    setup({ modules: [unknownModule] });

    const unknownModuleText = screen.queryByText(unknownModule.id);

    expect(unknownModuleText).not.toBeInTheDocument();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      MODULE_RENDERER_LOG.UNKNOWN_MODULE_TYPE,
      { moduleType: MOCK_UNKNOWN_MODULE_TYPE },
    );
  });

  it('forwards the post context to a module that reads it', () => {
    const relatedModule = mockModule('module_postRelated');

    setup({
      modules: [relatedModule],
      context: { post: { id: MOCK_POST_ID } },
    });

    const relatedPosts = screen.getByTestId(MOCK_POST_RELATED_STUB_TEST_ID);

    expect(relatedPosts).toHaveTextContent(
      `${relatedModule.id}:${MOCK_POST_ID}`,
    );
  });
});
