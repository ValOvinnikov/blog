import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { type IBookmarkRow, BookmarksList } from './bookmarks-list';

const PREFIX_TEST_ID = 'bookmarks-list-row-prefix';

faker.seed(123);

const MOCK_EMPTY_MESSAGE = faker.lorem.sentence();
const MOCK_PREFIX = faker.lorem.word();
const MOCK_HINT = faker.lorem.words(2);
const MOCK_BLOG_PATH = `/${faker.lorem.slug(1)}`;
const MOCK_BLOG_LINK_LABEL = faker.lorem.words(2);

const mockBookmarkRow = (): IBookmarkRow => ({
  id: faker.string.uuid(),
  formattedDate: faker.date.past().toLocaleDateString(),
  filename: `${faker.lorem.slug()}.md`,
  href: `/blog/${faker.lorem.slug()}`,
});

const rows = faker.helpers.multiple(mockBookmarkRow, { count: 3 });

const setup = customRender(BookmarksList, {
  rows,
  emptyMessage: MOCK_EMPTY_MESSAGE,
});

describe(`<${BookmarksList.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a row per bookmark with its date and filename link', () => {
      for (const bookmark of rows) {
        const date = screen.getByText(bookmark.formattedDate);
        const filenameLink = screen.getByRole('link', {
          name: bookmark.filename,
        });
        expect(date).toBeVisible();
        expect(filenameLink).toHaveAttribute('href', bookmark.href);
      }
    });

    it('exposes the rows as a list', () => {
      const list = screen.getByRole('list');
      expect(list).toBeVisible();
    });

    it('does not render a prefix glyph when omitted', () => {
      const prefix = screen.queryByTestId(PREFIX_TEST_ID);
      expect(prefix).not.toBeInTheDocument();
    });

    it('does not render a hint when omitted', () => {
      const hint = screen.queryByText(MOCK_HINT);
      expect(hint).not.toBeInTheDocument();
    });
  });

  it('renders the supplied prefix once per row', () => {
    setup({
      prefix: (
        <span data-testid={PREFIX_TEST_ID} aria-hidden="true">
          {MOCK_PREFIX}
        </span>
      ),
    });
    const glyphs = screen.getAllByTestId(PREFIX_TEST_ID);

    expect(glyphs).toHaveLength(rows.length);
    for (const glyph of glyphs) {
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
      expect(glyph).toHaveTextContent(MOCK_PREFIX);
    }
  });

  it('renders the prefix immediately before the row date and filename', () => {
    setup({ prefix: MOCK_PREFIX });
    const items = screen.getAllByRole('listitem');

    for (const [index, item] of items.entries()) {
      const bookmark = rows[index]!;
      expect(item).toHaveTextContent(
        `${MOCK_PREFIX}${bookmark.formattedDate}${bookmark.filename}`,
      );
    }
  });

  it('renders the hint when provided and rows are not empty', () => {
    setup({ hint: MOCK_HINT });
    const hint = screen.getByText(MOCK_HINT);
    expect(hint).toBeVisible();
  });

  it('renders the empty message instead of the list when rows is empty', () => {
    setup({ rows: [] });

    const emptyMessage = screen.getByText(MOCK_EMPTY_MESSAGE);
    const list = screen.queryByRole('list');
    expect(emptyMessage).toBeVisible();
    expect(list).not.toBeInTheDocument();
  });

  it('renders a rich empty message with its working link', () => {
    setup({
      rows: [],
      emptyMessage: (
        <>
          Browse <a href={MOCK_BLOG_PATH}>{MOCK_BLOG_LINK_LABEL}</a> to save a
          post.
        </>
      ),
    });

    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LINK_LABEL });
    expect(blogLink).toHaveAttribute('href', MOCK_BLOG_PATH);
  });

  it('does not render the hint in the empty state', () => {
    setup({ rows: [], hint: MOCK_HINT });
    const hint = screen.queryByText(MOCK_HINT);
    expect(hint).not.toBeInTheDocument();
  });

  it('renders filename links through the supplied link component', () => {
    setup({ linkAs: MockLink });

    const mockLinks = screen.getAllByTestId(MOCK_LINK_TEST_ID);
    expect(mockLinks).toHaveLength(rows.length);
  });
});
