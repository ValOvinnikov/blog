import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makePostCard } from '@web/testing/shared/post/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { redirect } from 'next/navigation';

import { BookmarksPage } from './bookmarks-page';

const {
  authMock,
  listBookmarksMock,
  getPostsByIdsMock,
  getChromeOnMock,
  getRequestTenantIdMock,
  getTenantSanityContextMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listBookmarksMock: vi.fn(),
  getPostsByIdsMock: vi.fn(),
  getChromeOnMock: vi.fn(),
  getRequestTenantIdMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

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

vi.mock('@web/utils/get-chrome-on', () => ({
  getChromeOn: getChromeOnMock,
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

const TENANT_ID = 'tenant-1';

const setup = customRenderAsync(BookmarksPage, {});

describe(`<${BookmarksPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listBookmarksMock.mockReset();
    getPostsByIdsMock.mockReset();
    getChromeOnMock.mockReset();
    getChromeOnMock.mockResolvedValue(true);
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT_ID);
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('redirects home without querying bookmarks when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(listBookmarksMock).not.toHaveBeenCalled();
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('redirects home without querying bookmarks when no tenant resolves', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getRequestTenantIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(listBookmarksMock).not.toHaveBeenCalled();
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('queries bookmarks for the signed-in user and tenant, then resolves ids via getPostsByIds', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([]);
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [] });

    await setup();

    expect(listBookmarksMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    expect(getPostsByIdsMock).toHaveBeenCalledWith(
      [],
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('forwards the resolved tenant Sanity context to getPostsByIds', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([]);
    getPostsByIdsMock.mockResolvedValue({ ok: true, data: [] });
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);

    await setup();

    expect(getPostsByIdsMock).toHaveBeenCalledWith([], tenant);
  });

  it('re-sorts resolved posts back into bookmark-recency order before rendering', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([
      { userId: 'user-1', postId: 'post-2', createdAt: new Date() },
      { userId: 'user-1', postId: 'post-1', createdAt: new Date() },
    ]);
    getPostsByIdsMock.mockResolvedValue({
      ok: true,
      data: [
        makePostCard({ id: 'post-1', slug: 'first' }),
        makePostCard({ id: 'post-2', slug: 'second' }),
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

  it('renders the plain list when getChromeOn resolves false', async () => {
    getChromeOnMock.mockResolvedValue(false);
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listBookmarksMock.mockResolvedValue([
      { userId: 'user-1', postId: 'post-1', createdAt: new Date() },
    ]);
    getPostsByIdsMock.mockResolvedValue({
      ok: true,
      data: [makePostCard({ id: 'post-1', slug: 'first', title: 'First' })],
    });

    await setup();

    expect(
      screen.queryByTestId('bookmarks-list-row-prefix'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'First' })).toHaveAttribute(
      'href',
      '/blog/first',
    );
  });
});
