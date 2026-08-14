export {};

const { authMock, exportAccountDataMock, getSoleTenantIdMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    exportAccountDataMock: vi.fn(),
    getSoleTenantIdMock: vi.fn(),
  }),
);

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@web/server/site-config/get-site-config', () => ({
  getSoleTenantId: getSoleTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: { account: { exportAccountData: exportAccountDataMock } },
}));

const TENANT_ID = 'tenant-1';

describe('GET /api/account/export', () => {
  beforeEach(() => {
    authMock.mockReset();
    exportAccountDataMock.mockReset();
    getSoleTenantIdMock.mockReset();
    getSoleTenantIdMock.mockResolvedValue(TENANT_ID);
  });

  it('returns 401 without querying the db when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import('./route');

    const response = await GET();

    expect(response.status).toBe(401);
    expect(exportAccountDataMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the session user has no matching account row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    exportAccountDataMock.mockResolvedValue(undefined);
    const { GET } = await import('./route');

    const response = await GET();

    expect(response.status).toBe(404);
  });

  it('streams the export as a downloadable JSON attachment', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const exportData = {
      profile: { id: 'user-1', name: 'Val', email: 'val@example.com' },
      bookmarks: [{ postId: 'post-1', createdAt: new Date('2026-01-01') }],
    };
    exportAccountDataMock.mockResolvedValue(exportData);
    const { GET } = await import('./route');

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="account-data.json"',
    );
    expect(json.profile).toEqual(exportData.profile);
    expect(json.bookmarks[0].postId).toBe('post-1');
    expect(exportAccountDataMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
  });

  it('returns 404 without querying the db when no tenant resolves', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getSoleTenantIdMock.mockResolvedValue(undefined);
    const { GET } = await import('./route');

    const response = await GET();

    expect(response.status).toBe(404);
    expect(exportAccountDataMock).not.toHaveBeenCalled();
  });

  it('returns 500 when the export query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    exportAccountDataMock.mockRejectedValue(new Error('boom'));
    const { GET } = await import('./route');

    const response = await GET();

    expect(response.status).toBe(500);
    errorSpy.mockRestore();
  });
});
