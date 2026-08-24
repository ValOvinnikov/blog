import type { TTenant } from '@blog/db/schema/tenants';

import { runSteps } from './run';

/**
 * Exercises the real `delete-sanity-project` step (and the real
 * `sanity-management-client` beneath it) against a stubbed `fetch` that
 * returns Sanity's org-billing-permission 401 — proving the rest of
 * deprovisioning still completes when project cancellation is structurally
 * blocked, rather than mocking that step away like `run.test.ts` does for
 * its step-sequencing coverage.
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
  fetchMock.mockReset().mockResolvedValue(
    new Response(
      JSON.stringify({
        code: 401,
        status: 'Unauthorized',
        message:
          'Cancellation of project "proj123" requires billing permission on organization "org1"',
      }),
      { status: 401 },
    ),
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
  it('reaches archive-tenant even when Sanity project deletion is blocked by org billing permission', async () => {
    const result = await runSteps(tenant, env);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(clearTenantArtifactsMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
  });

  it('tells clear-artifacts to keep sanityProjectId populated as the manual-deletion signal', async () => {
    await runSteps(tenant, env);

    expect(clearTenantArtifactsMock).toHaveBeenCalledWith(
      tenant,
      env,
      expect.objectContaining({ keepSanityProjectId: true }),
    );
  });
});
