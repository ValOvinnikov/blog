import { faker } from '@faker-js/faker';
import { service } from '@shinefold/service';
import { okResult } from '@shinefold/utils';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { mockIndexPage } from '@web/testing/pages/index-page/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_BREADCRUMBS_STUB_TEST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';

import { TaxonomyIndexPage } from './taxonomy-index-page';

faker.seed(5503);

vi.mock('@web/server/request-context/request-context');

vi.mock('@shinefold/service', () => ({
  service: {
    modules: { heroBlog: { v1: { getHeroBlog: vi.fn() } } },
  },
}));

vi.mock('@web/i18n/navigation');

const getHeroBlogMock = vi.mocked(service.modules.heroBlog.v1.getHeroBlog);

const MOCK_HERO_ID = faker.string.uuid();
const MOCK_HERO_HEADING = faker.lorem.words(3);
const MOCK_PAGE_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_INDEX_PAGE = mockIndexPage({
  headingBlock: mockHeadingBlock({
    heading: MOCK_PAGE_HEADING,
    supportingText: MOCK_SUPPORTING_TEXT,
  }),
});

const setup = customRenderServerAsync(TaxonomyIndexPage, {
  pageData: MOCK_INDEX_PAGE,
  breadcrumbs: <nav data-testid={MOCK_BREADCRUMBS_STUB_TEST_ID} />,
});

describe(`<${TaxonomyIndexPage.name}/>`, () => {
  describe('with the default index page', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the heading and supporting text inside main', () => {
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
      const breadcrumbs = screen.getByTestId(MOCK_BREADCRUMBS_STUB_TEST_ID);
      const main = screen.getByRole('main');

      expect(main).not.toContainElement(breadcrumbs);
    });
  });

  it('renders the hero in place of the heading when one is set', async () => {
    getHeroBlogMock.mockResolvedValueOnce(
      okResult(mockHeroBlogData({ heading: MOCK_HERO_HEADING })),
    );

    await setup({
      pageData: {
        ...MOCK_INDEX_PAGE,
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
