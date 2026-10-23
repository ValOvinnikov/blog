import { ACTION_OUTCOME, ERROR_CODE, TENANT_WRITE_REFUSAL } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
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

const USER_ID = 'user-1';
const POST_ID = 'post-1';
const SESSION = { user: { id: USER_ID } };
const NO_SESSION = 'there is no session';
const NO_TENANT = 'no tenant resolves';

describe(getBookmarkStatus, () => {
  beforeEach(() => {
    authMock.mockReset();
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(MOCK_TENANT_ID);
    isBookmarkedMock.mockReset();
    authMock.mockResolvedValue(SESSION);
  });

  it.each([
    [NO_SESSION, () => authMock.mockResolvedValue(null)],
    [NO_TENANT, () => getRequestTenantIdMock.mockResolvedValue(undefined)],
  ])('resolves false without querying the db when %s', async (_, arrange) => {
    arrange();

    await expect(getBookmarkStatus(POST_ID)).resolves.toBe(false);
    expect(isBookmarkedMock).not.toHaveBeenCalled();
  });

  it('resolves the db result for a signed-in user', async () => {
    isBookmarkedMock.mockResolvedValue(true);

    await expect(getBookmarkStatus(POST_ID)).resolves.toBe(true);
    expect(isBookmarkedMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      USER_ID,
      POST_ID,
    );
  });
});

describe(setBookmarkStatus, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue(SESSION);
    resolveWritableTenantMock.mockReset();
    resolveWritableTenantMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
    addBookmarkMock.mockReset();
    removeBookmarkMock.mockReset();
  });

  it.each([
    [
      ACTION_OUTCOME.SERVER_ERROR,
      NO_SESSION,
      () => authMock.mockResolvedValue(null),
    ],
    [
      ACTION_OUTCOME.SERVER_ERROR,
      NO_TENANT,
      () =>
        resolveWritableTenantMock.mockResolvedValue(
          errorResult(TENANT_WRITE_REFUSAL.UNRESOLVED),
        ),
    ],
    [
      ACTION_OUTCOME.UNAVAILABLE,
      'the tenant is not ACTIVE',
      () =>
        resolveWritableTenantMock.mockResolvedValue(
          errorResult(TENANT_WRITE_REFUSAL.INACTIVE),
        ),
    ],
  ])('returns %s without writing when %s', async (outcome, _, arrange) => {
    arrange();

    await expect(setBookmarkStatus(POST_ID, true)).resolves.toEqual({
      outcome,
    });
    expect(addBookmarkMock).not.toHaveBeenCalled();
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('adds a bookmark for the signed-in user when isBookmarked is true', async () => {
    addBookmarkMock.mockResolvedValue(okResult({}));

    await expect(setBookmarkStatus(POST_ID, true)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(addBookmarkMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      USER_ID,
      POST_ID,
    );
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('removes a bookmark for the signed-in user when isBookmarked is false', async () => {
    removeBookmarkMock.mockResolvedValue(undefined);

    await expect(setBookmarkStatus(POST_ID, false)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(removeBookmarkMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      USER_ID,
      POST_ID,
    );
    expect(addBookmarkMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'resolves a typed failure',
      () =>
        addBookmarkMock.mockResolvedValue(errorResult(ERROR_CODE.DB_NOT_FOUND)),
    ],
    ['throws an error', () => addBookmarkMock.mockRejectedValue(MOCK_ERROR)],
  ])('returns SERVER_ERROR when the write %s', async (_, arrange) => {
    arrange();

    await expect(setBookmarkStatus(POST_ID, true)).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
  });
});
