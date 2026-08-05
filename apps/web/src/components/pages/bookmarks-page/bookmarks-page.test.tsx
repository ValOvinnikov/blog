import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makePostCard } from '@web/testing/shared/post/fixtures';
import { redirect } from 'next/navigation';

import { BookmarksPage } from './bookmarks-page';

const { authMock, listBookmarksMock, getPostsByIdsMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  listBookmarksMock: vi.fn(),
  getPostsByIdsMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: { bookmarks: { listBookmarks: listBookmarksMock } },
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      posts: { v1: { getPostsByIds: getPostsByIdsMock } },
    },
  },
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const setup = customRenderAsync(BookmarksPage, {});

describe(`<${BookmarksPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listBookmarksMock.mockReset();
    getPostsByIdsMock.mockReset();
  });

  it('redirects home without querying bookmarks when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(listBookmarksMock).not.toHaveBeenCalled();
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('renders the true empty state when the signed-in reader has no bookmarks', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([]);
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [] });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'My bookmarks' }),
    ).toBeVisible();
    expect(
      screen.getByText('No bookmarks yet — save a post to find it here.'),
    ).toBeVisible();
    expect(listBookmarksMock).toHaveBeenCalledWith('user-1');
    expect(getPostsByIdsMock).toHaveBeenCalledWith([]);
  });

  it('renders resolved post cards sorted by bookmark recency', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([
      { userId: 'user-1', postId: 'post-2', createdAt: new Date() },
      { userId: 'user-1', postId: 'post-1', createdAt: new Date() },
    ]);
    getPostsByIdsMock.mockResolvedValue({
      ok: true,
      data: [
        makePostCard({ id: 'post-1', title: 'First Post', slug: 'first' }),
        makePostCard({ id: 'post-2', title: 'Second Post', slug: 'second' }),
      ],
    });

    await setup();

    expect(getPostsByIdsMock).toHaveBeenCalledWith(['post-2', 'post-1']);

    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(['Second Post', 'First Post']);
  });

  it('renders nothing when resolving bookmarked posts fails', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([
      { userId: 'user-1', postId: 'post-1', createdAt: new Date() },
    ]);
    getPostsByIdsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
