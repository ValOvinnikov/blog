import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { MOCK_DEPROVISION_ENV } from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';

import { runSteps } from './run';

const { removeTenantDomainMock } = vi.hoisted(() => ({
  removeTenantDomainMock: vi.fn(),
}));
const { revokeTenantSanityTokensMock } = vi.hoisted(() => ({
  revokeTenantSanityTokensMock: vi.fn(),
}));
const { clearTenantArtifactsMock } = vi.hoisted(() => ({
  clearTenantArtifactsMock: vi.fn(),
}));
const { archiveTenantRowMock } = vi.hoisted(() => ({
  archiveTenantRowMock: vi.fn(),
}));
const { purgeTenantReaderDataMock } = vi.hoisted(() => ({
  purgeTenantReaderDataMock: vi.fn(),
}));
const { invalidateTenantCacheMock } = vi.hoisted(() => ({
  invalidateTenantCacheMock: vi.fn(),
}));

vi.mock('./steps/remove-domain', () => ({
  removeTenantDomain: removeTenantDomainMock,
}));
vi.mock('./steps/revoke-sanity-tokens', () => ({
  revokeTenantSanityTokens: revokeTenantSanityTokensMock,
}));
vi.mock('./steps/clear-artifacts', () => ({
  clearTenantArtifacts: clearTenantArtifactsMock,
}));
vi.mock('./steps/archive-tenant', () => ({
  archiveTenantRow: archiveTenantRowMock,
}));
vi.mock('./steps/purge-reader-data', () => ({
  purgeTenantReaderData: purgeTenantReaderDataMock,
}));
vi.mock('./steps/invalidate-tenant-cache', () => ({
  invalidateTenantCache: invalidateTenantCacheMock,
}));

const fetchMock = vi.fn();

const MOCK_TENANT = mockTenant();
const MOCK_SANITY_PROJECT_ID = MOCK_TENANT.sanityProjectId;

function sanityProjectResponse(isDisabledByUser: boolean): Response {
  return new Response(
    JSON.stringify({
      id: MOCK_SANITY_PROJECT_ID,
      isDisabled: false,
      isDisabledByUser,
    }),
    { status: HTTP_STATUS.OK },
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock
    .mockReset()
    .mockResolvedValueOnce(sanityProjectResponse(false))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ isDisabledByUser: true }), {
        status: HTTP_STATUS.OK,
      }),
    );
  removeTenantDomainMock.mockReset().mockResolvedValue(undefined);
  revokeTenantSanityTokensMock.mockReset().mockResolvedValue(undefined);
  clearTenantArtifactsMock.mockReset().mockResolvedValue(undefined);
  archiveTenantRowMock.mockReset().mockResolvedValue(undefined);
  purgeTenantReaderDataMock.mockReset().mockResolvedValue(undefined);
  invalidateTenantCacheMock.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(runSteps, () => {
  it('archives the Sanity project via isDisabledByUser and reaches archive-tenant', async () => {
    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [patchUrl, patchInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(patchUrl).toBe(
      `https://api.sanity.io/v2021-06-07/projects/${MOCK_SANITY_PROJECT_ID}`,
    );
    expect(patchInit.method).toBe(HTTP_METHOD.PATCH);
    expect(patchInit.body).toBe(JSON.stringify({ isDisabledByUser: true }));
    expect(clearTenantArtifactsMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
    expect(purgeTenantReaderDataMock).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCacheMock).toHaveBeenCalledTimes(1);
  });

  it('does not call PATCH again when the project is already archived', async () => {
    fetchMock.mockReset().mockResolvedValueOnce(sanityProjectResponse(true));

    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
  });
});
