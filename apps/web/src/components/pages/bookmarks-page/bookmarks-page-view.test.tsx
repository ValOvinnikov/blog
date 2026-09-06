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

  it('renders the panel heading as a level-2 heading with the same title', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'My bookmarks' }),
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
});
