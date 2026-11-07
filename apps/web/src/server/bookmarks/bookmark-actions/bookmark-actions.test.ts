import {
  ACTION_OUTCOME,
  CAPABILITY,
  ERROR_CODE,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { queries } from '@blog/db';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { isReaderAccountFeatureEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { arrangeNoSessionOnce } from '@web/testing/shared/session/arrange-no-session-once';
import { MOCK_USER_ID } from '@web/testing/shared/session/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { getBookmarkStatus, setBookmarkStatus } from './bookmark-actions';

vi.mock('@web/server/auth/auth');

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/server/tenant/write-gate/write-gate');

vi.mock(
  '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled',
);

vi.mock('@blog/db', () => ({
  queries: {
    bookmarks: {
      isBookmarked: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
    },
  },
}));

faker.seed(6010);

const MOCK_POST_ID = faker.string.uuid();
const MOCK_BOOKMARK = {
  createdAt: faker.date.past(),
  tenantId: MOCK_TENANT_ID,
  userId: MOCK_USER_ID,
  postId: MOCK_POST_ID,
};
const NO_SESSION = 'there is no session';
const NO_TENANT = 'no tenant resolves';

describe(getBookmarkStatus, () => {
  it.each([
    [NO_SESSION, arrangeNoSessionOnce],
    [
      NO_TENANT,
      () => vi.mocked(getRequestTenantId).mockResolvedValueOnce(undefined),
    ],
  ])('answers false without querying the db when %s', async (_, arrange) => {
    arrange();

    const isBookmarked = await getBookmarkStatus(MOCK_POST_ID);

    expect(isBookmarked).toBe(false);
    expect(queries.bookmarks.isBookmarked).not.toHaveBeenCalled();
  });

  it('answers the stored status for a signed-in user', async () => {
    vi.mocked(queries.bookmarks.isBookmarked).mockResolvedValueOnce(true);

    const isBookmarked = await getBookmarkStatus(MOCK_POST_ID);

    expect(isBookmarked).toBe(true);
    expect(queries.bookmarks.isBookmarked).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_USER_ID,
      MOCK_POST_ID,
    );
  });
});

describe(setBookmarkStatus, () => {
  it.each([
    [ACTION_OUTCOME.SERVER_ERROR, NO_SESSION, arrangeNoSessionOnce],
    [
      ACTION_OUTCOME.SERVER_ERROR,
      NO_TENANT,
      () =>
        vi
          .mocked(resolveWritableTenant)
          .mockResolvedValueOnce(errorResult(TENANT_WRITE_REFUSAL.UNRESOLVED)),
    ],
    [
      ACTION_OUTCOME.UNAVAILABLE,
      'the tenant is not active',
      () =>
        vi
          .mocked(resolveWritableTenant)
          .mockResolvedValueOnce(errorResult(TENANT_WRITE_REFUSAL.INACTIVE)),
    ],
    [
      ACTION_OUTCOME.UNAVAILABLE,
      'bookmarks are switched off',
      () =>
        vi.mocked(isReaderAccountFeatureEnabled).mockResolvedValueOnce(false),
    ],
  ])('answers %s without writing when %s', async (outcome, _, arrange) => {
    arrange();

    const saveResult = await setBookmarkStatus(MOCK_POST_ID, true);
    arrange();
    const removeResult = await setBookmarkStatus(MOCK_POST_ID, false);

    expect(saveResult).toEqual({ outcome });
    expect(removeResult).toEqual({ outcome });
    expect(queries.bookmarks.addBookmark).not.toHaveBeenCalled();
    expect(queries.bookmarks.removeBookmark).not.toHaveBeenCalled();
  });

  it('checks bookmarks as a reader-account feature', async () => {
    await setBookmarkStatus(MOCK_POST_ID, true);

    expect(isReaderAccountFeatureEnabled).toHaveBeenCalledWith(
      CAPABILITY.BOOKMARKS,
    );
  });

  it('adds a bookmark for the signed-in user when bookmarking', async () => {
    vi.mocked(queries.bookmarks.addBookmark).mockResolvedValueOnce(
      okResult(MOCK_BOOKMARK),
    );

    const result = await setBookmarkStatus(MOCK_POST_ID, true);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(queries.bookmarks.addBookmark).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_USER_ID,
      MOCK_POST_ID,
    );
    expect(queries.bookmarks.removeBookmark).not.toHaveBeenCalled();
  });

  it('removes the bookmark for the signed-in user when unbookmarking', async () => {
    const result = await setBookmarkStatus(MOCK_POST_ID, false);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(queries.bookmarks.removeBookmark).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_USER_ID,
      MOCK_POST_ID,
    );
    expect(queries.bookmarks.addBookmark).not.toHaveBeenCalled();
  });

  it.each([
    [
      'resolves a typed failure',
      () =>
        vi
          .mocked(queries.bookmarks.addBookmark)
          .mockResolvedValueOnce(errorResult(ERROR_CODE.DB_NOT_FOUND)),
    ],
    [
      'throws an error',
      () =>
        vi
          .mocked(queries.bookmarks.addBookmark)
          .mockRejectedValueOnce(MOCK_ERROR),
    ],
  ])('answers server-error when the write %s', async (_, arrange) => {
    arrange();

    const result = await setBookmarkStatus(MOCK_POST_ID, true);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
