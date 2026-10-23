import { ACTION_OUTCOME, ERROR_CODE, TENANT_WRITE_REFUSAL } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { getBookmarkStatus, setBookmarkStatus } from './bookmark-actions';

const {
  authMock,

  resolveWritableTenantMock,
  isBookmarkedMock,
  addBookmarkMock,
  removeBookmarkMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  resolveWritableTenantMock: vi.fn(),
  isBookmarkedMock: vi.fn(),
  addBookmarkMock: vi.fn(),
  removeBookmarkMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: resolveWritableTenantMock,
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

const getRequestTenantIdMock = vi.mocked(getRequestTenantId);

describe('getBookmarkStatus', () => {
  beforeEach(() => {
    authMock.mockReset();
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(MOCK_TENANT_ID);
    isBookmarkedMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('resolves false without querying the db when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(false);
    expect(isBookmarkedMock).not.toHaveBeenCalled();
  });

  it('resolves false without querying the db when no tenant resolves', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(false);
    expect(isBookmarkedMock).not.toHaveBeenCalled();
  });

  it('resolves the db result for a signed-in user', async () => {
    isBookmarkedMock.mockResolvedValue(true);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(true);
    expect(isBookmarkedMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      'user-1',
      'post-1',
    );
  });
});

describe('setBookmarkStatus', () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    resolveWritableTenantMock.mockReset();
    resolveWritableTenantMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
    addBookmarkMock.mockReset();
    removeBookmarkMock.mockReset();
  });

  it('returns SERVER_ERROR without writing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(addBookmarkMock).not.toHaveBeenCalled();
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR without writing when no tenant resolves', async () => {
    resolveWritableTenantMock.mockResolvedValue(
      errorResult(TENANT_WRITE_REFUSAL.UNRESOLVED),
    );

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(addBookmarkMock).not.toHaveBeenCalled();
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns UNAVAILABLE without writing when the tenant is not ACTIVE', async () => {
    resolveWritableTenantMock.mockResolvedValue(
      errorResult(TENANT_WRITE_REFUSAL.INACTIVE),
    );

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      outcome: ACTION_OUTCOME.UNAVAILABLE,
    });
    expect(addBookmarkMock).not.toHaveBeenCalled();
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('adds a bookmark for the signed-in user when isBookmarked is true', async () => {
    addBookmarkMock.mockResolvedValue(okResult({}));

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(addBookmarkMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      'user-1',
      'post-1',
    );
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR when addBookmark resolves a typed failure', async () => {
    addBookmarkMock.mockResolvedValue(errorResult(ERROR_CODE.DB_NOT_FOUND));

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
  });

  it('removes a bookmark for the signed-in user when isBookmarked is false', async () => {
    removeBookmarkMock.mockResolvedValue(undefined);

    await expect(setBookmarkStatus('post-1', false)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(removeBookmarkMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      'user-1',
      'post-1',
    );
    expect(addBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR when the write throws', async () => {
    addBookmarkMock.mockRejectedValue(new Error('boom'));

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
  });
});
