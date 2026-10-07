export {};

const { authMock, exportAccountDataMock, resolveTenantIdMock, headersMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    exportAccountDataMock: vi.fn(),
    resolveTenantIdMock: vi.fn(),
    headersMock: vi.fn(),
  }));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  resolveTenantId: resolveTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: { account: { exportAccountData: exportAccountDataMock } },
}));

vi.mock('next/headers', () => ({ headers: headersMock }));

const TENANT_ID = 'tenant-1';

describe('GET /api/account/export', () => {
  let GET: typeof import('./route').GET;

  beforeEach(async () => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    exportAccountDataMock.mockReset();
    resolveTenantIdMock.mockReset();
    resolveTenantIdMock.mockResolvedValue(TENANT_ID);
    headersMock.mockReset();
    headersMock.mockResolvedValue(new Headers({ host: 'acme.example.com' }));
    ({ GET } = await import('./route'));
  });

  it('returns 401 without querying the db when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const response = await GET();

    expect(response.status).toBe(401);
    expect(exportAccountDataMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the session user has no matching account row', async () => {
    exportAccountDataMock.mockResolvedValue(undefined);
    const response = await GET();

    expect(response.status).toBe(404);
  });

  it('streams the export as a downloadable JSON attachment', async () => {
    const exportData = {
      profile: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
      bookmarks: [{ postId: 'post-1', createdAt: new Date('2026-01-01') }],
    };
    exportAccountDataMock.mockResolvedValue(exportData);
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
    resolveTenantIdMock.mockResolvedValue(undefined);
    const response = await GET();

    expect(response.status).toBe(404);
    expect(exportAccountDataMock).not.toHaveBeenCalled();
  });

  it('resolves the tenant from the request Host header', async () => {
    exportAccountDataMock.mockResolvedValue({
      profile: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
      bookmarks: [],
    });
    await GET();

    expect(resolveTenantIdMock).toHaveBeenCalledWith('acme.example.com');
  });

  it('returns 500 when the export query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    exportAccountDataMock.mockRejectedValue(new Error('boom'));
    const response = await GET();

    expect(response.status).toBe(500);
    errorSpy.mockRestore();
  });
});
