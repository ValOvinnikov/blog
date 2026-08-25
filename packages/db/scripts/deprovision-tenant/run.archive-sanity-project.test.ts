import type { TTenant } from '@blog/db/schema/tenants';

import { runSteps } from './run';

/**
 * Exercises the real `archive-sanity-project` step (and the real
 * `sanity-management-client` beneath it) against a stubbed `fetch` — proving
 * deprovisioning archives the Sanity project via `isDisabledByUser`, rather
 * than mocking that step away like `run.test.ts` does for its
 * step-sequencing coverage.
 */

const { removeTenantDomainMock } = vi.hoisted(() => ({
  removeTenantDomainMock: vi.fn(),
}));
const { deleteTenantStudioProjectMock } = vi.hoisted(() => ({
  deleteTenantStudioProjectMock: vi.fn(),
}));
const { clearTenantArtifactsMock } = vi.hoisted(() => ({
  clearTenantArtifactsMock: vi.fn(),
}));
const { archiveTenantRowMock } = vi.hoisted(() => ({
  archiveTenantRowMock: vi.fn(),
}));

vi.mock('./steps/remove-domain', () => ({
  removeTenantDomain: removeTenantDomainMock,
}));
vi.mock('./steps/delete-studio-project', () => ({
  deleteTenantStudioProject: deleteTenantStudioProjectMock,
}));
vi.mock('./steps/clear-artifacts', () => ({
  clearTenantArtifacts: clearTenantArtifactsMock,
}));
vi.mock('./steps/archive-tenant', () => ({
  archiveTenantRow: archiveTenantRowMock,
}));

const fetchMock = vi.fn();

const tenant = {
  id: 'tenant-1',
  slug: 'acme',
  sanityProjectId: 'proj123',
  sanityDataset: 'production',
} as TTenant;

const env = {
  sanityManagementToken: 'sanity-token',
  vercelToken: 'vercel-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'proj-1',
  dryRun: false,
  githubActor: 'octocat',
  githubRunId: 'run-42',
};

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock
    .mockReset()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'proj123',
          isDisabled: false,
          isDisabledByUser: false,
        }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ isDisabledByUser: true }), { status: 200 }),
    );
  removeTenantDomainMock.mockReset().mockResolvedValue(undefined);
  deleteTenantStudioProjectMock.mockReset().mockResolvedValue(undefined);
  clearTenantArtifactsMock.mockReset().mockResolvedValue(undefined);
  archiveTenantRowMock.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(runSteps, () => {
  it('archives the Sanity project via isDisabledByUser and reaches archive-tenant', async () => {
    const result = await runSteps(tenant, env);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [patchUrl, patchInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(patchUrl).toBe('https://api.sanity.io/v2021-06-07/projects/proj123');
    expect(patchInit.method).toBe('PATCH');
    expect(patchInit.body).toBe(JSON.stringify({ isDisabledByUser: true }));
    expect(clearTenantArtifactsMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
  });

  it('does not call PATCH again when the project is already archived', async () => {
    fetchMock.mockReset().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'proj123',
          isDisabled: false,
          isDisabledByUser: true,
        }),
        { status: 200 },
      ),
    );

    const result = await runSteps(tenant, env);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
  });
});
