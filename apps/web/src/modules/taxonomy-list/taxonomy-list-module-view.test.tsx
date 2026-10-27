import { BRAND_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_FIRST_TOPIC_POST_TITLE,
  MOCK_SECOND_TOPIC_POST_TITLE,
  MOCK_TOPIC_DESCRIPTION,
  MOCK_TOPIC_LIST_ITEM,
} from '@web/testing/modules/taxonomy-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TaxonomyListModuleView } from './taxonomy-list-module-view';

faker.seed(6011);

vi.mock('@web/i18n/navigation');

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_TITLE_ID = faker.string.alphanumeric(10);
const MOCK_DATA_TEST_ID = faker.string.alphanumeric(10);
const MOCK_EMPTY_MESSAGE = faker.lorem.sentence();
const MOCK_LATEST_LABEL = faker.lorem.word();
const ITEM_TITLE_PATTERN = new RegExp(MOCK_TOPIC_LIST_ITEM.title);

const setup = customRender(TaxonomyListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_HEADING }),
  items: [MOCK_TOPIC_LIST_ITEM],
  layout: undefined,
  contentAlignment: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
  headingLevel: 2,
  emptyMessage: MOCK_EMPTY_MESSAGE,
  showLatestPosts: true,
  latestLabel: MOCK_LATEST_LABEL,
});

describe(`<${TaxonomyListModuleView.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its heading', () => {
      const section = screen.getByRole('region', { name: MOCK_HEADING });

      expect(section).toBeVisible();
    });

    it('renders a linked card per entry with its description and post count', () => {
      const link = screen.getByRole('link', { name: ITEM_TITLE_PATTERN });
      const cardHeading = screen.getByRole('heading', {
        level: 3,
        name: ITEM_TITLE_PATTERN,
      });
      const description = screen.getByText(MOCK_TOPIC_DESCRIPTION);
      const postCount = screen.getByText(MOCK_TOPIC_LIST_ITEM.postCountLabel);

      expect(link).toHaveAttribute('href', MOCK_TOPIC_LIST_ITEM.href);
      expect(cardHeading).toBeVisible();
      expect(description).toBeVisible();
      expect(postCount).toBeVisible();
    });

    it('lists an entry’s latest posts, newest first', () => {
      const list = screen.getByRole('list', {
        name: MOCK_TOPIC_LIST_ITEM.latestPostsLabel,
      });
      const [firstLink, secondLink] = within(list).getAllByRole('link');
      const [firstPost] = MOCK_TOPIC_LIST_ITEM.posts;

      expect(firstLink).toHaveTextContent(MOCK_FIRST_TOPIC_POST_TITLE);
      expect(firstLink).toHaveAttribute('href', firstPost?.href);
      expect(secondLink).toHaveTextContent(MOCK_SECOND_TOPIC_POST_TITLE);
    });

    it('shows the latest label above an entry’s latest posts', () => {
      const latestLabel = screen.getByText(MOCK_LATEST_LABEL);

      expect(latestLabel).toBeVisible();
    });
  });

  it('renders the section heading at the given level', () => {
    setup({ headingLevel: 3 });

    const heading = screen.getByRole('heading', {
      level: 3,
      name: MOCK_HEADING,
    });

    expect(heading).toBeVisible();
  });

  it('renders the empty message and no cards when there are no items', () => {
    setup({ items: [] });

    const emptyMessage = screen.getByText(MOCK_EMPTY_MESSAGE);
    const link = screen.queryByRole('link');

    expect(emptyMessage).toBeVisible();
    expect(link).not.toBeInTheDocument();
  });

  it('omits the latest-posts list when latest posts are switched off', () => {
    setup({ showLatestPosts: false });

    const list = screen.queryByRole('list', {
      name: MOCK_TOPIC_LIST_ITEM.latestPostsLabel,
    });
    const postTitle = screen.queryByText(MOCK_FIRST_TOPIC_POST_TITLE);

    expect(list).not.toBeInTheDocument();
    expect(postTitle).not.toBeInTheDocument();
  });

  it('omits the latest-posts list when the entry has no posts', () => {
    setup({ items: [{ ...MOCK_TOPIC_LIST_ITEM, posts: [] }] });

    const list = screen.queryByRole('list', {
      name: MOCK_TOPIC_LIST_ITEM.latestPostsLabel,
    });
    const latestLabel = screen.queryByText(MOCK_LATEST_LABEL);

    expect(list).not.toBeInTheDocument();
    expect(latestLabel).not.toBeInTheDocument();
  });
});
