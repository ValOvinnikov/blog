const { requireAdminMock, getDomainVerificationStatusMock } = vi.hoisted(
  () => ({
    requireAdminMock: vi.fn(),
    getDomainVerificationStatusMock: vi.fn(),
  }),
);

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('./get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

describe('getDomainVerificationStatusAction', () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    getDomainVerificationStatusMock.mockReset();
  });

  it('requires an admin session before checking the domain', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const { getDomainVerificationStatusAction } =
      await import('./get-domain-verification-status-action');

    await expect(
      getDomainVerificationStatusAction('acme.example.com'),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });

  it('returns the fresh verification status for the given domain', async () => {
    getDomainVerificationStatusMock.mockResolvedValue('VERIFIED');
    const { getDomainVerificationStatusAction } =
      await import('./get-domain-verification-status-action');

    await expect(
      getDomainVerificationStatusAction('acme.example.com'),
    ).resolves.toBe('VERIFIED');
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'acme.example.com',
    );
  });
});
