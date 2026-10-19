import { ACTION_OUTCOME, ERROR_CODE } from '@blog/config';

import { deleteAccountAction } from './account-actions';

const { authMock, deleteAccountMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteAccountMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: { account: { deleteAccount: deleteAccountMock } },
}));

describe('deleteAccountAction', () => {
  beforeEach(() => {
    authMock.mockReset();
    deleteAccountMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns SERVER_ERROR without deleting when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(deleteAccountAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(deleteAccountMock).not.toHaveBeenCalled();
  });

  it('deletes the session user and returns SUCCESS', async () => {
    deleteAccountMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(deleteAccountAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(deleteAccountMock).toHaveBeenCalledWith('user-1');
  });

  it('returns BLOCKED when the account holds a platform role', async () => {
    deleteAccountMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_HOLDS_PLATFORM_ROLE,
    });

    await expect(deleteAccountAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.BLOCKED,
    });
  });

  it('returns SERVER_ERROR when the delete throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    deleteAccountMock.mockRejectedValue(new Error('boom'));

    await expect(deleteAccountAction()).resolves.toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    errorSpy.mockRestore();
  });
});
