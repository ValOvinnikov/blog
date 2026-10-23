import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { type IBookmarkRow, BookmarksList } from './bookmarks-list';

const EMPTY_MESSAGE = 'No bookmarks yet — save a post to find it here.';
const PREFIX_TEST_ID = 'bookmarks-list-row-prefix';
const BOOKMARKS_LIST_TEST_ID = 'bookmarks-list';

faker.seed(123);

const mockBookmarkRow = (): IBookmarkRow => ({
  id: faker.string.uuid(),
  formattedDate: faker.date.past().toLocaleDateString(),
  filename: `${faker.lorem.slug()}.md`,
  href: `/blog/${faker.lorem.slug()}`,
});

const rows = faker.helpers.multiple(mockBookmarkRow, { count: 3 });

const setup = customRender(BookmarksList, {
  rows,
  emptyMessage: EMPTY_MESSAGE,
});

describe(`<${BookmarksList.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a row per bookmark with its date and filename link', () => {
      for (const bookmark of rows) {
        expect(screen.getByText(bookmark.formattedDate)).toBeVisible();
        expect(
          screen.getByRole('link', { name: bookmark.filename }),
        ).toHaveAttribute('href', bookmark.href);
      }
    });

    it('exposes the rows as an explicit list', () => {
      expect(screen.getByRole('list')).toBeVisible();
    });

    it('does not render a prefix glyph when omitted', () => {
      expect(screen.queryByTestId(PREFIX_TEST_ID)).not.toBeInTheDocument();
    });

    it('does not render a hint when omitted', () => {
      expect(screen.queryByText(/saved/)).not.toBeInTheDocument();
    });
  });

  it('renders the supplied prefix node as-is, unmodified, once per row', () => {
    setup({
      prefix: (
        <span data-testid={PREFIX_TEST_ID} aria-hidden="true">
          drwx
        </span>
      ),
    });
    const glyphs = screen.getAllByTestId(PREFIX_TEST_ID);

    expect(glyphs).toHaveLength(rows.length);
    for (const glyph of glyphs) {
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
      expect(glyph).toHaveTextContent('drwx');
    }
  });

  it('renders the prefix immediately before the row date and filename', () => {
    setup({ prefix: 'drwx' });
    const items = screen.getAllByRole('listitem');

    for (const [index, item] of items.entries()) {
      const bookmark = rows[index]!;
      expect(item.textContent).toBe(
        `drwx${bookmark.formattedDate}${bookmark.filename}`,
      );
    }
  });

  it('renders the hint below the list when provided and rows are not empty', () => {
    setup({ hint: '3 saved' });
    expect(screen.getByText('3 saved')).toBeVisible();
  });

  it('renders the empty message instead of the list when rows is empty', () => {
    setup({ rows: [] });

    expect(screen.getByText(EMPTY_MESSAGE)).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders a rich empty message with its working link', () => {
    setup({
      rows: [],
      emptyMessage: (
        <>
          Browse <a href="/blog">the blog</a> to save a post.
        </>
      ),
    });

    expect(screen.getByRole('link', { name: 'the blog' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('does not render the hint in the empty state', () => {
    setup({ rows: [], hint: '3 saved' });
    expect(screen.queryByText('3 saved')).not.toBeInTheDocument();
  });

  it('renders filename links via linkAs when provided', () => {
    setup({ linkAs: MockLink });

    expect(screen.getAllByTestId(MOCK_LINK_TEST_ID)).toHaveLength(rows.length);
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: BOOKMARKS_LIST_TEST_ID });
    expect(screen.getByTestId(BOOKMARKS_LIST_TEST_ID)).toBeVisible();
  });
});
