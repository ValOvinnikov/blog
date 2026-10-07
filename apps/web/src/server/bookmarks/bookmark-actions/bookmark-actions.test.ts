import { TENANT_WRITE_REFUSAL } from '@blog/config';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import type { MockInstance } from 'vitest';

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

const TENANT_ID = 'tenant-1';

describe('getBookmarkStatus', () => {
  beforeEach(() => {
    authMock.mockReset();
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT_ID);
    isBookmarkedMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('resolves false without querying the db when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(false);
    expect(isBookmarkedMock).not.toHaveBeenCalled();
  });

  it('resolves false without querying the db when no tenant resolves', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(false);
    expect(isBookmarkedMock).not.toHaveBeenCalled();
  });

  it('resolves the db result for a signed-in user', async () => {
    isBookmarkedMock.mockResolvedValue(true);

    await expect(getBookmarkStatus('post-1')).resolves.toBe(true);
    expect(isBookmarkedMock).toHaveBeenCalledWith(
      TENANT_ID,
      'user-1',
      'post-1',
    );
  });
});

describe('setBookmarkStatus', () => {
  let errorSpy: MockInstance<typeof console.error>;

  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    resolveWritableTenantMock.mockReset();
    resolveWritableTenantMock.mockResolvedValue({
      ok: true,
      tenantId: TENANT_ID,
    });
    addBookmarkMock.mockReset();
    removeBookmarkMock.mockReset();
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('returns a refusal without writing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(addBookmarkMock).not.toHaveBeenCalled();
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns a refusal without writing when no tenant resolves', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
    expect(addBookmarkMock).not.toHaveBeenCalled();
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('flags the refusal unavailable without writing when the tenant is not ACTIVE', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.INACTIVE,
    });

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: false,
      isUnavailable: true,
    });
    expect(addBookmarkMock).not.toHaveBeenCalled();
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('adds a bookmark for the signed-in user when isBookmarked is true', async () => {
    addBookmarkMock.mockResolvedValue({ ok: true, data: {} });

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: true,
    });
    expect(addBookmarkMock).toHaveBeenCalledWith(TENANT_ID, 'user-1', 'post-1');
    expect(removeBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns a refusal when addBookmark resolves a typed failure', async () => {
    addBookmarkMock.mockResolvedValue({ ok: false, error: 'DB_NOT_FOUND' });

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
  });

  it('removes a bookmark for the signed-in user when isBookmarked is false', async () => {
    removeBookmarkMock.mockResolvedValue(undefined);

    await expect(setBookmarkStatus('post-1', false)).resolves.toEqual({
      ok: true,
    });
    expect(removeBookmarkMock).toHaveBeenCalledWith(
      TENANT_ID,
      'user-1',
      'post-1',
    );
    expect(addBookmarkMock).not.toHaveBeenCalled();
  });

  it('returns a refusal when the write throws', async () => {
    addBookmarkMock.mockRejectedValue(new Error('boom'));

    await expect(setBookmarkStatus('post-1', true)).resolves.toEqual({
      ok: false,
      isUnavailable: false,
    });
  });
});
