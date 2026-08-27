import { customRender, screen } from '@web/testing/custom-render';
import { makeBookmarksPageView } from '@web/testing/pages/bookmarks-page/fixtures';

import { BookmarksPageView } from './bookmarks-page-view';

const setup = customRender(BookmarksPageView, makeBookmarksPageView());

describe(BookmarksPageView, () => {
  it('renders the heading', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'My bookmarks' }),
    ).toBeVisible();
  });

  it('renders the true empty state when there are no posts', () => {
    setup({ posts: [], hint: undefined });

    expect(
      screen.getByText('No bookmarks yet — save a post to find it here.'),
    ).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText(/saved$/)).not.toBeInTheDocument();
  });

  it('renders the terminal window chrome with the resolved prompt copy', () => {
    setup();

    expect(screen.getAllByText('My bookmarks')).toHaveLength(2);
  });

  it('renders resolved posts as ls -l rows with a saved-count hint', () => {
    setup();

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'static-first-rendering.md',
      'a-tour-of-the-new-editor.md',
    ]);
    expect(links[0]).toHaveAttribute('href', '/blog/static-first-rendering');
    expect(links[1]).toHaveAttribute('href', '/blog/a-tour-of-the-new-editor');
    expect(screen.getByText('2 saved')).toBeVisible();
    expect(screen.getAllByTestId('bookmarks-list-row-prefix')).toHaveLength(2);
    for (const prefix of screen.getAllByTestId('bookmarks-list-row-prefix')) {
      expect(prefix).toHaveTextContent('drwx');
      expect(prefix).toHaveAttribute('aria-hidden', 'true');
    }
  });

  describe('plain', () => {
    it('renders the true empty state with no ls -l chrome', () => {
      setup({ isPlain: true, posts: [], hint: undefined });

      expect(
        screen.getByText('No bookmarks yet — save a post to find it here.'),
      ).toBeVisible();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('renders resolved posts as a plain list of title links, no ls -l styling', () => {
      setup({ isPlain: true });

      const links = screen.getAllByRole('link');
      expect(links.map((link) => link.textContent)).toEqual([
        'Static-first rendering, revisited',
        'A tour of the new editor',
      ]);
      expect(links[0]).toHaveAttribute('href', '/blog/static-first-rendering');
      expect(screen.getByText('2 saved')).toBeVisible();
      expect(
        screen.queryByTestId('bookmarks-list-row-prefix'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('static-first-rendering.md'),
      ).not.toBeInTheDocument();
    });
  });
});
