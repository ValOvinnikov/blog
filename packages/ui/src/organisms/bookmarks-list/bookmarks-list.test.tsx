import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

import { type IBookmarkRow, BookmarksList } from './bookmarks-list';

faker.seed(123);

const makeRow = (): IBookmarkRow => ({
  id: faker.string.uuid(),
  formattedDate: faker.date.past().toLocaleDateString(),
  filename: `${faker.lorem.slug()}.md`,
  href: `/blog/${faker.lorem.slug()}`,
});

const rows = faker.helpers.multiple(makeRow, { count: 3 });

const setup = customRender(BookmarksList, {
  rows,
  emptyMessage: 'No bookmarks yet — save a post to find it here.',
});

describe(`<${BookmarksList.name}/>`, () => {
  it('renders a row per bookmark with its date and filename link', () => {
    setup();

    for (const bookmark of rows) {
      expect(screen.getByText(bookmark.formattedDate)).toBeVisible();
      expect(
        screen.getByRole('link', { name: bookmark.filename }),
      ).toHaveAttribute('href', bookmark.href);
    }
  });

  it('exposes the rows as an explicit list', () => {
    setup();
    expect(screen.getByRole('list')).toBeVisible();
  });

  it('does not render a prefix glyph when omitted', () => {
    setup();
    expect(
      screen.queryByTestId('bookmarks-list-row-prefix'),
    ).not.toBeInTheDocument();
  });

  it('renders the supplied prefix node as-is, unmodified, once per row', () => {
    setup({
      prefix: (
        <span data-testid="bookmarks-list-row-prefix" aria-hidden="true">
          drwx
        </span>
      ),
    });
    const glyphs = screen.getAllByTestId('bookmarks-list-row-prefix');

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

  it('does not render a hint when omitted', () => {
    setup();
    expect(screen.queryByText(/saved/)).not.toBeInTheDocument();
  });

  it('renders the empty message instead of the list when rows is empty', () => {
    setup({ rows: [] });

    expect(
      screen.getByText('No bookmarks yet — save a post to find it here.'),
    ).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('does not render the hint in the empty state', () => {
    setup({ rows: [], hint: '3 saved' });
    expect(screen.queryByText('3 saved')).not.toBeInTheDocument();
  });

  it('renders filename links via linkAs when provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    );

    setup({ linkAs: CustomLink });

    expect(screen.getAllByTestId('custom-link')).toHaveLength(rows.length);
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'bookmarks-list' });
    expect(screen.getByTestId('bookmarks-list')).toBeVisible();
  });
});
