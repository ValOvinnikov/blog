import { faker } from '@faker-js/faker';
import { TAXONOMY_KIND } from '@shinefold/config';
import { service } from '@shinefold/service';
import { errorResult, okResult } from '@shinefold/utils';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_FAQ_PAGE_JSON_LD_FRAGMENT,
  mockFaqPageQuestion,
} from '@web/testing/shared/json-ld/fixtures';
import { readJsonLd } from '@web/testing/shared/json-ld/read-json-ld';
import { MOCK_POST_LIST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import {
  mockTopic,
  mockTopicDetailPage,
} from '@web/testing/shared/topic/fixtures';

import { TaxonomyPage } from './taxonomy-page';

faker.seed(3127);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@shinefold/service', () => ({
  service: {
    modules: {
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getHeroBlogMock = vi.mocked(service.modules.heroBlog.v1.getHeroBlog);
const getPostListMock = vi.mocked(service.modules.postList.v1.getPostList);

const BREADCRUMBS_TEST_ID = 'taxonomy-page-breadcrumbs';
const CHILDREN_TEST_ID = 'taxonomy-page-children';

const MOCK_TERM = mockTopic({
  id: faker.string.uuid(),
  title: faker.lorem.word(),
});
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_HERO_HEADING = faker.lorem.words(3);
const MOCK_PAGE_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_PAGE_NUMBER = faker.number.int({ min: 2, max: 9 });

const MOCK_PAGE_DATA = mockTopicDetailPage({
  topic: MOCK_TERM,
  headingBlock: mockHeadingBlock({
    heading: MOCK_PAGE_HEADING,
    supportingText: MOCK_SUPPORTING_TEXT,
  }),
});
const MOCK_POST_LIST_PAGE_DATA = {
  ...MOCK_PAGE_DATA,
  modules: [{ id: MOCK_POST_LIST_ID, type: 'module_postList' as const }],
};

const setup = customRenderServerAsync(TaxonomyPage, {
  kind: TAXONOMY_KIND.TOPICS,
  slug: faker.lorem.slug(),
  term: MOCK_TERM,
  pageData: MOCK_PAGE_DATA,
  breadcrumbs: <nav data-testid={BREADCRUMBS_TEST_ID} />,
});

describe(`<${TaxonomyPage.name}/>`, () => {
  describe('with the default page', () => {
    beforeEach(async () => {
      await setup({ children: <div data-testid={CHILDREN_TEST_ID} /> });
    });

    it('renders the page heading and supporting text inside main', () => {
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading', {
        level: 1,
        name: MOCK_PAGE_HEADING,
      });
      const supportingText = within(main).getByText(MOCK_SUPPORTING_TEXT);

      expect(heading).toBeVisible();
      expect(supportingText).toBeVisible();
    });

    it('renders the given breadcrumbs outside main', () => {
      const breadcrumbs = screen.getByTestId(BREADCRUMBS_TEST_ID);
      const main = screen.getByRole('main');

      expect(main).not.toContainElement(breadcrumbs);
    });

    it('renders the given children inside main', () => {
      const children = screen.getByTestId(CHILDREN_TEST_ID);
      const main = screen.getByRole('main');

      expect(main).toContainElement(children);
    });
  });

  it.each([
    { page: MOCK_PAGE_NUMBER, expected: MOCK_PAGE_NUMBER },
    { page: undefined, expected: 1 },
  ])(
    'loads post lists for page $expected of the term archive',
    async ({ page, expected }) => {
      getPostListMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

      await expect(
        setup({ page, pageData: MOCK_POST_LIST_PAGE_DATA }),
      ).rejects.toBe(MOCK_ERROR);

      expect(getPostListMock).toHaveBeenCalledWith(
        MOCK_POST_LIST_ID,
        MOCK_TENANT_SANITY_CONTEXT,
        expected,
        { termId: MOCK_TERM.id },
      );
    },
  );

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    await setup({
      pageData: { ...MOCK_PAGE_DATA, faqs: [mockFaqPageQuestion()] },
    });

    expect(readJsonLd()).toContain(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT);
  });

  it('renders the hero in place of the heading when one is set', async () => {
    getHeroBlogMock.mockResolvedValueOnce(
      okResult(mockHeroBlogData({ heading: MOCK_HERO_HEADING })),
    );

    await setup({
      pageData: {
        ...MOCK_PAGE_DATA,
        hero: { id: MOCK_HERO_ID, type: 'module_heroBlog' },
      },
    });

    const heroHeading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_HERO_HEADING,
    });
    const pageHeading = screen.queryByRole('heading', {
      level: 1,
      name: MOCK_PAGE_HEADING,
    });

    expect(heroHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });
});
