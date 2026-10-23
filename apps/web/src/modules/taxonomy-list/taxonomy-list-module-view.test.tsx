import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_FIRST_TOPIC_POST_TITLE,
  MOCK_SECOND_TOPIC_POST_TITLE,
  MOCK_TOPIC_LIST_ITEM,
} from '@web/testing/modules/taxonomy-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TaxonomyListModuleView } from './taxonomy-list-module-view';

vi.mock('@web/i18n/navigation');

const HEADING = 'Browse by topic';
const TITLE_ID = 'topic-list-title';
const DATA_TEST_ID = 'taxonomy-list-module-topic-list-1';
const EMPTY_MESSAGE = 'No topics yet.';
const LATEST_LABEL = 'Latest';

const setup = customRender(TaxonomyListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: HEADING }),
  items: [MOCK_TOPIC_LIST_ITEM],
  layout: undefined,
  contentAlignment: undefined,
  titleId: TITLE_ID,
  dataTestId: DATA_TEST_ID,
  headingLevel: 2,
  emptyMessage: EMPTY_MESSAGE,
  showLatestPosts: true,
  latestLabel: LATEST_LABEL,
});

describe(`<${TaxonomyListModuleView.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with the given titleId', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: HEADING,
      });
      expect(heading).toHaveAttribute('id', TITLE_ID);

      const section = screen.getByRole('region', { name: HEADING });
      expect(section).toBeVisible();
      expect(section).toHaveAttribute('aria-labelledby', TITLE_ID);
      expect(section).toHaveAttribute('data-testid', DATA_TEST_ID);
    });

    it('renders a linked card per entry with the post count as a level-3 heading', () => {
      const link = screen.getByRole('link', { name: /Engineering/ });
      expect(link).toHaveAttribute('href', MOCK_TOPIC_LIST_ITEM.href);
      const cardHeading = screen.getByRole('heading', {
        level: 3,
        name: /Engineering/,
      });
      const description = screen.getByText(MOCK_TOPIC_LIST_ITEM.description!);
      const postCount = screen.getByText(MOCK_TOPIC_LIST_ITEM.postCountLabel);
      expect(cardHeading).toBeVisible();
      expect(description).toBeVisible();
      expect(postCount).toBeVisible();
    });

    it('lists an entry’s latest posts, newest first', () => {
      const list = screen.getByRole('list', {
        name: MOCK_TOPIC_LIST_ITEM.latestPostsLabel,
      });
      const postLinks = within(list).getAllByRole('link');
      expect(postLinks.map((link) => link.textContent)).toEqual([
        MOCK_FIRST_TOPIC_POST_TITLE,
        MOCK_SECOND_TOPIC_POST_TITLE,
      ]);
      expect(postLinks[0]).toHaveAttribute(
        'href',
        '/blog/shipping-the-new-build-pipeline',
      );
    });

    it('shows the latest label above an entry’s latest posts', () => {
      const latestLabel = screen.getByText(LATEST_LABEL);
      expect(latestLabel).toBeVisible();
    });
  });

  it('renders the section heading at the given level', () => {
    setup({ headingLevel: 3 });

    const heading = screen.getByRole('heading', {
      level: 3,
      name: HEADING,
    });
    expect(heading).toBeVisible();
  });

  it('renders the empty message and no cards when there are no items', () => {
    setup({ items: [] });

    const emptyMessage = screen.getByText(EMPTY_MESSAGE);
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
    const latestLabel = screen.queryByText(LATEST_LABEL);
    expect(list).not.toBeInTheDocument();
    expect(latestLabel).not.toBeInTheDocument();
  });
});
