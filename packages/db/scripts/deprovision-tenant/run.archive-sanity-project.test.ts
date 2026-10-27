import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { MOCK_DEPROVISION_ENV } from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { runSteps } from './run';
import { archiveTenantRow } from './steps/archive-tenant';
import { clearTenantArtifacts } from './steps/clear-artifacts';
import { invalidateTenantCache } from './steps/invalidate-tenant-cache';
import { purgeTenantReaderData } from './steps/purge-reader-data';
import { removeTenantDomain } from './steps/remove-domain';
import { revokeTenantSanityTokens } from './steps/revoke-sanity-tokens';

vi.mock('./steps/remove-domain');
vi.mock('./steps/revoke-sanity-tokens');
vi.mock('./steps/clear-artifacts');
vi.mock('./steps/archive-tenant');
vi.mock('./steps/purge-reader-data');
vi.mock('./steps/invalidate-tenant-cache');

faker.seed(5765);

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
    .mockResolvedValueOnce(sanityProjectResponse(false))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ isDisabledByUser: true }), {
        status: HTTP_STATUS.OK,
      }),
    );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(runSteps, () => {
  it('archives the Sanity project and reaches the later steps', async () => {
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
    expect(removeTenantDomain).toHaveBeenCalledTimes(1);
    expect(revokeTenantSanityTokens).toHaveBeenCalledTimes(1);
    expect(clearTenantArtifacts).toHaveBeenCalledTimes(1);
    expect(archiveTenantRow).toHaveBeenCalledTimes(1);
    expect(purgeTenantReaderData).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCache).toHaveBeenCalledTimes(1);
  });

  it('does not PATCH again when the project is already archived', async () => {
    fetchMock.mockReset().mockResolvedValueOnce(sanityProjectResponse(true));

    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRow).toHaveBeenCalledTimes(1);
  });
});
