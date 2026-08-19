import { getBookmarkStatus, setBookmarkStatus } from './bookmark-actions';

const {
  authMock,
  getRequestTenantIdMock,
  isBookmarkedMock,
  addBookmarkMock,
  removeBookmarkMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getRequestTenantIdMock: vi.fn(),
  isBookmarkedMock: vi.fn(),
  addBookmarkMock: vi.fn(),
  removeBookmarkMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    bookmarks: {
      isBookmarked: isBookmarkedMock,
      addBookmark: addBookmarkMock,
      removeBookmark: removeBookmarkMock,
    },
  },
}));

const TENANT_ID = 'tenant-1';

describe('getBookmarkStatus', () => {
  beforeEach(() => {
    authMock.mockReset();
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT_ID);
    isBookmarkedMock.mockReset();
  });

  it('resolves false without querying the db when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(false);
    expect(isBookmarkedMock).not.toHaveBeenCalled();
  });

  it('resolves false without querying the db when no tenant resolves', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getRequestTenantIdMock.mockResolvedValue(undefined);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(false);
    expect(isBookmarkedMock).not.toHaveBeenCalled();
  });

  it('resolves the db result for a signed-in user', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    isBookmarkedMock.mockResolvedValue(true);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(true);
    expect(isBookmarkedMock).toHaveBeenCalledWith(
      TENANT_ID,
      'user-1',
      'post-1',
    );
  });
});

describe('setBookmarkStatus', () => {
  beforeEach(() => {
    authMock.mockReset();
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT_ID);
    addBookmarkMock.mockReset();
    removeBookmarkMock.mockReset();
  });

  it('returns { ok: false } without writing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: false,
    });
    expect(addBookmarkMock).not.toHaveBeenCalled();
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without writing when no tenant resolves', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getRequestTenantIdMock.mockResolvedValue(undefined);

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: false,
    });
    expect(addBookmarkMock).not.toHaveBeenCalled();
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('adds a bookmark for the signed-in user when isBookmarked is true', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    addBookmarkMock.mockResolvedValue({ ok: true, data: {} });

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: true,
    });
    expect(addBookmarkMock).toHaveBeenCalledWith(TENANT_ID, 'user-1', 'post-1');
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } when addBookmark resolves a typed failure', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    addBookmarkMock.mockResolvedValue({ ok: false, error: 'DB_NOT_FOUND' });

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: false,
    });

    errorSpy.mockRestore();
  });

  it('removes a bookmark for the signed-in user when isBookmarked is false', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    removeBookmarkMock.mockResolvedValue(undefined);

    await expect(setBookmarkStatus('post-1', false)).resolves.toEqual({
      ok: true,
    });
    expect(removeBookmarkMock).toHaveBeenCalledWith(
      TENANT_ID,
      'user-1',
      'post-1',
    );
    expect(addBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } when the write throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    addBookmarkMock.mockRejectedValue(new Error('boom'));

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: false,
    });

    errorSpy.mockRestore();
  });
});
