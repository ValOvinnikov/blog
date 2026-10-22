import { HTTP_STATUS } from '@blog/config/constants';
import { DEFAULT_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

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

const USER_ID = 'user-1';
const HOST = 'acme.example.com';
const PROFILE = { id: USER_ID, name: 'Jane Doe', email: 'jane@example.com' };

describe('GET /api/account/export', () => {
  let GET: typeof import('./route').GET;

  beforeEach(async () => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    exportAccountDataMock.mockReset();
    resolveTenantIdMock.mockReset();
    resolveTenantIdMock.mockResolvedValue(DEFAULT_TENANT_ID);
    headersMock.mockReset();
    headersMock.mockResolvedValue(new Headers({ host: HOST }));
    ({ GET } = await import('./route'));
  });

  it('returns 401 without querying the db when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const response = await GET();

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(exportAccountDataMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the session user has no matching account row', async () => {
    exportAccountDataMock.mockResolvedValue(undefined);
    const response = await GET();

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it('streams the export as a downloadable JSON attachment', async () => {
    const exportData = {
      profile: PROFILE,
      bookmarks: [{ postId: 'post-1', createdAt: new Date('2026-01-01') }],
    };
    exportAccountDataMock.mockResolvedValue(exportData);
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="account-data.json"',
    );
    expect(json.profile).toEqual(PROFILE);
    expect(json.bookmarks[0].postId).toBe('post-1');
    expect(exportAccountDataMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      USER_ID,
    );
  });

  it('returns 404 without querying the db when no tenant resolves', async () => {
    resolveTenantIdMock.mockResolvedValue(undefined);
    const response = await GET();

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(exportAccountDataMock).not.toHaveBeenCalled();
  });

  it('resolves the tenant from the request Host header', async () => {
    exportAccountDataMock.mockResolvedValue({
      profile: PROFILE,
      bookmarks: [],
    });
    await GET();

    expect(resolveTenantIdMock).toHaveBeenCalledWith(HOST);
  });

  it('returns 500 when the export query throws', async () => {
    exportAccountDataMock.mockRejectedValue(new Error('boom'));
    const response = await GET();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});
