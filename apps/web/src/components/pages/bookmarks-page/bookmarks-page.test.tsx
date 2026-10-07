import { LOCALE_ISO_CODES } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makePostCard } from '@web/testing/shared/post/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { redirect } from 'next/navigation';

import { BookmarksPage } from './bookmarks-page';

vi.mock('@web/server/request-context/request-context');

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
const TENANT_ID = 'tenant-1';

const setup = customRenderAsync(BookmarksPage, {});

describe(`<${BookmarksPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listBookmarksMock.mockReset();
    getPostsByIdsMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([]);
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [] });
  });

  it('redirects home without querying bookmarks when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(listBookmarksMock).not.toHaveBeenCalled();
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('redirects home without querying bookmarks when no tenant resolves', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(listBookmarksMock).not.toHaveBeenCalled();
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('queries bookmarks for the signed-in user and tenant, then resolves ids via getPostsByIds', async () => {
    await setup();

    expect(listBookmarksMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    expect(getPostsByIdsMock).toHaveBeenCalledWith(
      [],
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('forwards the request context Sanity context to getPostsByIds', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });

    await setup();

    expect(getPostsByIdsMock).toHaveBeenCalledWith([], tenant);
  });

  it('re-sorts resolved posts back into bookmark-recency order before rendering', async () => {
    listBookmarksMock.mockResolvedValue([
      { userId: 'user-1', postId: 'post-2', createdAt: new Date() },
      { userId: 'user-1', postId: 'post-1', createdAt: new Date() },
    ]);
    getPostsByIdsMock.mockResolvedValue({
      ok: true,
      data: [
        { ...makePostCard({ id: 'post-1', slug: 'first' }), language: EN },
        { ...makePostCard({ id: 'post-2', slug: 'second' }), language: EN },
      ],
    });

    await setup();

    expect(getPostsByIdsMock).toHaveBeenCalledWith(
      ['post-2', 'post-1'],
      DEFAULT_TENANT_SANITY_CONTEXT,
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'second.md',
      'first.md',
    ]);
    expect(links[0]).toHaveAttribute('href', '/blog/second');
    expect(links[1]).toHaveAttribute('href', '/blog/first');
  });

  it('links each bookmark to the language it was saved in, whatever the page language', async () => {
    listBookmarksMock.mockResolvedValue([
      { userId: 'user-1', postId: 'post-nl', createdAt: new Date() },
      { userId: 'user-1', postId: 'post-en', createdAt: new Date() },
    ]);
    getPostsByIdsMock.mockResolvedValue({
      ok: true,
      data: [
        {
          ...makePostCard({ id: 'post-nl', slug: 'mijn-artikel' }),
          language: NL,
        },
        {
          ...makePostCard({ id: 'post-en', slug: 'my-article' }),
          language: EN,
        },
      ],
    });
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: NL,
      defaultLocale: EN,
    });

    await setup();

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/nl/blog/mijn-artikel');
    expect(links[1]).toHaveAttribute('href', '/blog/my-article');
  });

  it('renders nothing when resolving bookmarked posts fails', async () => {
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
