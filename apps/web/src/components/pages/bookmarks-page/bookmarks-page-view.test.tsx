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

  it('renders a distinct level-2 panel heading, not a repeat of the page title', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Saved posts' }),
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

  it('renders resolved posts as rows with a saved-count hint, no decorative prefix', () => {
    setup();

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'static-first-rendering.md',
      'a-tour-of-the-new-editor.md',
    ]);
    expect(links[0]).toHaveAttribute('href', '/blog/static-first-rendering');
    expect(links[1]).toHaveAttribute('href', '/blog/a-tour-of-the-new-editor');
    expect(screen.getByText('2 saved')).toBeVisible();
    expect(
      screen.queryByTestId('bookmarks-list-row-prefix'),
    ).not.toBeInTheDocument();
  });
});
