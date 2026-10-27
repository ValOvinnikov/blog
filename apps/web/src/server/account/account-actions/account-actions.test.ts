import { ACTION_OUTCOME, ERROR_CODE } from '@blog/config';
import { queries } from '@blog/db';
import { errorResult, okResult } from '@blog/utils';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { arrangeNoSessionOnce } from '@web/testing/shared/session/arrange-no-session-once';
import { MOCK_USER_ID } from '@web/testing/shared/session/fixtures';

import { deleteAccountAction } from './account-actions';

vi.mock('@web/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: { account: { deleteAccount: vi.fn() } },
}));

describe(deleteAccountAction, () => {
  it('answers server-error without deleting when there is no session', async () => {
    arrangeNoSessionOnce();

    const result = await deleteAccountAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(queries.account.deleteAccount).not.toHaveBeenCalled();
  });

  it('deletes the session user and answers success', async () => {
    vi.mocked(queries.account.deleteAccount).mockResolvedValueOnce(okResult());

    const result = await deleteAccountAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(queries.account.deleteAccount).toHaveBeenCalledWith(MOCK_USER_ID);
  });

  it('answers blocked when the account holds a platform role', async () => {
    vi.mocked(queries.account.deleteAccount).mockResolvedValueOnce(
      errorResult(ERROR_CODE.DB_HOLDS_PLATFORM_ROLE),
    );

    const result = await deleteAccountAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.BLOCKED });
  });

  it('answers server-error when the delete throws', async () => {
    vi.mocked(queries.account.deleteAccount).mockRejectedValueOnce(MOCK_ERROR);

    const result = await deleteAccountAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});
