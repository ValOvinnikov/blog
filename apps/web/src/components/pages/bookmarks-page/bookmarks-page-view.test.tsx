import { customRender, screen } from '@web/testing/custom-render';
import { mockBookmarksPageView } from '@web/testing/pages/bookmarks-page/fixtures';

import { BookmarksPageView } from './bookmarks-page-view';

const setup = customRender(BookmarksPageView, mockBookmarksPageView());

describe(`<${BookmarksPageView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the heading', () => {
      const myBookmarksHeading = screen.getByRole('heading', {
        level: 1,
        name: 'My bookmarks',
      });

      expect(myBookmarksHeading).toBeVisible();
    });

    it('renders a distinct level-2 panel heading, not a repeat of the page title', () => {
      const savedPostsHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Saved posts',
      });

      expect(savedPostsHeading).toBeVisible();
    });

    it('renders resolved posts as rows with a saved-count hint, no decorative prefix', () => {
      const links = screen.getAllByRole('link');
      const savedCountText = screen.getByText('2 saved');
      const rowPrefix = screen.queryByTestId('bookmarks-list-row-prefix');

      expect(links.map((link) => link.textContent)).toEqual([
        'static-first-rendering.md',
        'a-tour-of-the-new-editor.md',
      ]);
      expect(links[0]).toHaveAttribute('href', '/blog/static-first-rendering');
      expect(links[1]).toHaveAttribute(
        'href',
        '/blog/a-tour-of-the-new-editor',
      );
      expect(savedCountText).toBeVisible();
      expect(rowPrefix).not.toBeInTheDocument();
    });
  });

  it('renders the true empty state when there are no posts', () => {
    setup({ posts: [], hint: undefined });

    const emptyMessage = screen.getByText(
      'No bookmarks yet — save a post to find it here.',
    );
    const list = screen.queryByRole('list');
    const savedText = screen.queryByText(/saved$/);

    expect(emptyMessage).toBeVisible();
    expect(list).not.toBeInTheDocument();
    expect(savedText).not.toBeInTheDocument();
  });
});
