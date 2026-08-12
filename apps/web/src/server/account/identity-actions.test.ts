export {};

const { authMock, unlinkProviderMock, updateDisplayNameMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    unlinkProviderMock: vi.fn(),
    updateDisplayNameMock: vi.fn(),
  }),
);

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    account: {
      unlinkProvider: unlinkProviderMock,
      updateDisplayName: updateDisplayNameMock,
    },
  },
}));

const session = {
  user: { id: 'user-1', email: 'jane@icloud.com' },
};

describe('unlinkProviderAction', () => {
  beforeEach(() => {
    authMock.mockReset();
    unlinkProviderMock.mockReset();
  });

  it('returns { ok: false, reason: "unknown" } without unlinking when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const { unlinkProviderAction } = await import('./identity-actions');

    await expect(unlinkProviderAction('github')).resolves.toEqual({
      ok: false,
      reason: 'unknown',
    });
    expect(unlinkProviderMock).not.toHaveBeenCalled();
  });

  it('rejects a provider that is not literally "github" or "google" at runtime, without logging or querying it', async () => {
    // `provider` is compile-time only — a `'use server'` action can be
    // invoked with an arbitrary string at runtime, bypassing TypeScript.
    // This cast simulates that, exercising the runtime `isLinkableProvider`
    // guard.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    const { unlinkProviderAction } = await import('./identity-actions');

    await expect(
      unlinkProviderAction('DROP TABLE accounts;--' as 'github'),
    ).resolves.toEqual({ ok: false, reason: 'unknown' });

    expect(authMock).not.toHaveBeenCalled();
    expect(unlinkProviderMock).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("unlinks the session user's provider and returns { ok: true }", async () => {
    authMock.mockResolvedValue(session);
    unlinkProviderMock.mockResolvedValue({ outcome: 'unlinked' });
    const { unlinkProviderAction } = await import('./identity-actions');

    await expect(unlinkProviderAction('github')).resolves.toEqual({
      ok: true,
    });
    expect(unlinkProviderMock).toHaveBeenCalledWith('user-1', 'github');
  });

  it('returns { ok: false, reason: "last-method" } when the db rejects the unlink', async () => {
    authMock.mockResolvedValue(session);
    unlinkProviderMock.mockResolvedValue({ outcome: 'last-method' });
    const { unlinkProviderAction } = await import('./identity-actions');

    await expect(unlinkProviderAction('google')).resolves.toEqual({
      ok: false,
      reason: 'last-method',
    });
  });

  it('returns { ok: false, reason: "unknown" } and logs when the db write throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    unlinkProviderMock.mockRejectedValue(new Error('boom'));
    const { unlinkProviderAction } = await import('./identity-actions');

    await expect(unlinkProviderAction('github')).resolves.toEqual({
      ok: false,
      reason: 'unknown',
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('updateDisplayNameAction', () => {
  beforeEach(() => {
    authMock.mockReset();
    updateDisplayNameMock.mockReset();
  });

  it('returns { ok: false } without updating when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const { updateDisplayNameAction } = await import('./identity-actions');

    await expect(updateDisplayNameAction('Jane')).resolves.toEqual({
      ok: false,
    });
    expect(updateDisplayNameMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false } without updating when the trimmed name is empty', async () => {
    authMock.mockResolvedValue(session);
    const { updateDisplayNameAction } = await import('./identity-actions');

    await expect(updateDisplayNameAction('   ')).resolves.toEqual({
      ok: false,
    });
    expect(updateDisplayNameMock).not.toHaveBeenCalled();
  });

  it('trims the name, updates it, and returns { ok: true }', async () => {
    authMock.mockResolvedValue(session);
    updateDisplayNameMock.mockResolvedValue(undefined);
    const { updateDisplayNameAction } = await import('./identity-actions');

    await expect(updateDisplayNameAction('  Jane Doe  ')).resolves.toEqual({
      ok: true,
    });
    expect(updateDisplayNameMock).toHaveBeenCalledWith('user-1', 'Jane Doe');
  });

  it('returns { ok: false } and logs when the db write throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue(session);
    updateDisplayNameMock.mockRejectedValue(new Error('boom'));
    const { updateDisplayNameAction } = await import('./identity-actions');

    await expect(updateDisplayNameAction('Jane')).resolves.toEqual({
      ok: false,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
