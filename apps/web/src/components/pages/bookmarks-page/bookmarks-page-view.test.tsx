import { customRender, screen } from '@web/testing/custom-render';
import { mockBookmarksPageView } from '@web/testing/pages/bookmarks-page/fixtures';

import { BookmarksPageView } from './bookmarks-page-view';

const MOCK_HINT = 'Two bookmarks saved';
const MOCK_EMPTY_MESSAGE = 'Nothing saved yet';
const MOCK_PROPS = mockBookmarksPageView({
  hint: MOCK_HINT,
  emptyMessage: MOCK_EMPTY_MESSAGE,
});

const setup = customRender(BookmarksPageView, MOCK_PROPS);

describe(`<${BookmarksPageView.name}/>`, () => {
  describe('with posts', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the heading', () => {
      const pageHeading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_PROPS.heading,
      });

      expect(pageHeading).toBeVisible();
    });

    it('renders a distinct level-2 panel heading', () => {
      const listHeading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_PROPS.listHeading,
      });

      expect(listHeading).toBeVisible();
    });

    it('renders the posts as filename links in the given order', () => {
      const links = screen.getAllByRole('link');

      expect(links.map((link) => link.textContent)).toEqual(
        MOCK_PROPS.posts.map(({ filename }) => filename),
      );
    });

    it.each(MOCK_PROPS.posts.map(({ filename, href }) => [filename, href]))(
      'links %s to its post',
      (filename, href) => {
        const postLink = screen.getByRole('link', { name: filename });

        expect(postLink).toHaveAttribute('href', href);
      },
    );

    it('renders the hint', () => {
      const hint = screen.getByText(MOCK_HINT);

      expect(hint).toBeVisible();
    });
  });

  it('renders the empty message, with no list or hint, when there are no posts', () => {
    setup({ posts: [] });

    const emptyMessage = screen.getByText(MOCK_EMPTY_MESSAGE);
    const list = screen.queryByRole('list');
    const hint = screen.queryByText(MOCK_HINT);

    expect(emptyMessage).toBeVisible();
    expect(list).not.toBeInTheDocument();
    expect(hint).not.toBeInTheDocument();
  });
});
