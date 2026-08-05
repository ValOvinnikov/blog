import { getBookmarkStatus, setBookmarkStatus } from './bookmark-actions';

const { authMock, isBookmarkedMock, addBookmarkMock, removeBookmarkMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    isBookmarkedMock: vi.fn(),
    addBookmarkMock: vi.fn(),
    removeBookmarkMock: vi.fn(),
  }));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    bookmarks: {
      isBookmarked: isBookmarkedMock,
      addBookmark: addBookmarkMock,
      removeBookmark: removeBookmarkMock,
    },
  },
}));

describe('getBookmarkStatus', () => {
  beforeEach(() => {
    authMock.mockReset();
    isBookmarkedMock.mockReset();
  });

  it('resolves false without querying the db when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(false);
    expect(isBookmarkedMock).not.toHaveBeenCalled();
  });

  it('resolves the db result for a signed-in user', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    isBookmarkedMock.mockResolvedValue(true);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(true);
    expect(isBookmarkedMock).toHaveBeenCalledWith('user-1', 'post-1');
  });
});

describe('setBookmarkStatus', () => {
  beforeEach(() => {
    authMock.mockReset();
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

  it('adds a bookmark for the signed-in user when isBookmarked is true', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    addBookmarkMock.mockResolvedValue({});

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: true,
    });
    expect(addBookmarkMock).toHaveBeenCalledWith('user-1', 'post-1');
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('removes a bookmark for the signed-in user when isBookmarked is false', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    removeBookmarkMock.mockResolvedValue(undefined);

    await expect(setBookmarkStatus('post-1', false)).resolves.toEqual({
      ok: true,
    });
    expect(removeBookmarkMock).toHaveBeenCalledWith('user-1', 'post-1');
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
