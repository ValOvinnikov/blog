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
  });

  it('returns { ok: false } without deleting when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(deleteAccountAction()).resolves.toEqual({ ok: false });
    expect(deleteAccountMock).not.toHaveBeenCalled();
  });

  it('deletes the session user and returns { ok: true }', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    deleteAccountMock.mockResolvedValue(undefined);

    await expect(deleteAccountAction()).resolves.toEqual({ ok: true });
    expect(deleteAccountMock).toHaveBeenCalledWith('user-1');
  });

  it('returns { ok: false } when the delete throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    deleteAccountMock.mockRejectedValue(new Error('boom'));

    await expect(deleteAccountAction()).resolves.toEqual({ ok: false });

    errorSpy.mockRestore();
  });
});
