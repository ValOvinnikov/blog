import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR, routes } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getVoiceRich } from '@web/server/site-config/get-voice-rich/get-voice-rich';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_EN_POST_SLUG,
  MOCK_NL_POST_SLUG,
  mockPostCard,
} from '@web/testing/shared/post/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { redirect } from 'next/navigation';

import { BookmarksPage } from './bookmarks-page';

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

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

const { EN, NL } = LOCALE_ISO_CODES;
const LINK_TEXT = 'browse the blog';
const LINK_HREF = '/blog';
const USER_ID = 'user-1';
const SAVED_AT = new Date();

const bookmarkOf = (postId: string) => ({
  userId: USER_ID,
  postId,
  createdAt: SAVED_AT,
});

const setup = customRenderAsync(BookmarksPage, {});

describe(`<${BookmarksPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listBookmarksMock.mockReset();
    getPostsByIdsMock.mockReset();
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    listBookmarksMock.mockResolvedValue([]);
    getPostsByIdsMock.mockResolvedValue(okResult([]));
  });

  it.each([
    [
      'there is no session',
      () => {
        authMock.mockResolvedValue(null);
      },
    ],
    [
      'no tenant resolves',
      () => {
        vi.mocked(getRequestContext).mockResolvedValueOnce({
          ...MOCK_REQUEST_CONTEXT,
          tenantId: undefined,
        });
      },
    ],
  ])(
    'redirects home without querying bookmarks when %s',
    async (_case, arrange) => {
      arrange();

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
      expect(listBookmarksMock).not.toHaveBeenCalled();
      expect(getPostsByIdsMock).not.toHaveBeenCalled();
    },
  );

  it("queries the user's bookmarks for the tenant and resolves their posts", async () => {
    await setup();

    expect(listBookmarksMock).toHaveBeenCalledWith(MOCK_TENANT_ID, USER_ID);
    expect(getPostsByIdsMock).toHaveBeenCalledWith(
      [],
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('re-sorts resolved posts back into bookmark-recency order before rendering', async () => {
    listBookmarksMock.mockResolvedValue([
      bookmarkOf('post-2'),
      bookmarkOf('post-1'),
    ]);
    getPostsByIdsMock.mockResolvedValue(
      okResult([
        { ...mockPostCard({ id: 'post-1', slug: 'first' }), language: EN },
        { ...mockPostCard({ id: 'post-2', slug: 'second' }), language: EN },
      ]),
    );

    await setup();

    expect(getPostsByIdsMock).toHaveBeenCalledWith(
      ['post-2', 'post-1'],
      MOCK_TENANT_SANITY_CONTEXT,
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'second.md',
      'first.md',
    ]);
    expect(links[0]).toHaveAttribute('href', '/blog/second');
    expect(links[1]).toHaveAttribute('href', '/blog/first');
  });

  it('links each bookmark in the language it was saved in', async () => {
    listBookmarksMock.mockResolvedValue([
      bookmarkOf('post-nl'),
      bookmarkOf('post-en'),
    ]);
    getPostsByIdsMock.mockResolvedValue(
      okResult([
        {
          ...mockPostCard({ id: 'post-nl', slug: MOCK_NL_POST_SLUG }),
          language: NL,
        },
        {
          ...mockPostCard({ id: 'post-en', slug: MOCK_EN_POST_SLUG }),
          language: EN,
        },
      ]),
    );
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: NL,
      defaultLocale: EN,
    });

    await setup();

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute(
      'href',
      `/nl${routes.post(MOCK_NL_POST_SLUG)}`,
    );
    expect(links[1]).toHaveAttribute('href', routes.post(MOCK_EN_POST_SLUG));
  });

  it('renders the catalog empty message when there are no bookmarks', async () => {
    await setup();

    expect(vi.mocked(getVoiceRich)).toHaveBeenCalledWith('bookmarksEmpty');
    const emptyMessage = screen.getByText(
      'No bookmarks yet — save a post to find it here.',
    );
    expect(emptyMessage).toBeVisible();
  });

  it('renders the tenant-authored empty message with its link', async () => {
    vi.mocked(getVoiceRich).mockResolvedValueOnce(
      mockFormattedVoiceRich({ linkText: LINK_TEXT, href: LINK_HREF }),
    );

    await setup();

    const link = screen.getByRole('link', { name: LINK_TEXT });
    expect(link).toHaveAttribute('href', LINK_HREF);
  });

  it('renders nothing when resolving bookmarked posts fails', async () => {
    listBookmarksMock.mockResolvedValue([bookmarkOf('post-1')]);
    getPostsByIdsMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
