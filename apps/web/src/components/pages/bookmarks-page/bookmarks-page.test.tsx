import { customRenderAsync, screen } from '@web/testing/custom-render';
import { redirect } from 'next/navigation';

import { BookmarksPage } from './bookmarks-page';

const { authMock, listBookmarksMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  listBookmarksMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: { bookmarks: { listBookmarks: listBookmarksMock } },
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
  });

  it('redirects home without querying bookmarks when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(listBookmarksMock).not.toHaveBeenCalled();
  });

  it('renders the true empty state when the signed-in reader has no bookmarks', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([]);

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'My bookmarks' }),
    ).toBeVisible();
    expect(
      screen.getByText('No bookmarks yet — save a post to find it here.'),
    ).toBeVisible();
    expect(listBookmarksMock).toHaveBeenCalledWith('user-1');
  });

  it('renders a distinct "coming soon" message (not the true-empty copy) when the reader does have bookmarks', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([
      { userId: 'user-1', postId: 'post-1', createdAt: new Date() },
      { userId: 'user-1', postId: 'post-2', createdAt: new Date() },
    ]);

    await setup();

    expect(
      screen.queryByText('No bookmarks yet — save a post to find it here.'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('2 saved posts — full previews are coming soon.'),
    ).toBeVisible();
  });
});
