import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { runSteps } from './run';

/**
 * Exercises the real `unarchiveSanityProject` client (via a stubbed
 * `fetch`) end to end through `runSteps`, proving that re-provisioning a
 * tenant `deprovision-tenant` had archived actually restores its Sanity
 * project's API/CDN access, rather than mocking the client away like
 * `run.test.ts` does for its step-sequencing coverage.
 */

const { reactivateTenantMock } = vi.hoisted(() => ({
  reactivateTenantMock: vi.fn(),
}));
const { reportStepStatusMock } = vi.hoisted(() => ({
  reportStepStatusMock: vi.fn(),
}));
const { createTenantSanityProjectMock } = vi.hoisted(() => ({
  createTenantSanityProjectMock: vi.fn(),
}));
const { seedTenantContentMock } = vi.hoisted(() => ({
  seedTenantContentMock: vi.fn(),
}));
const { createTenantStudioMock } = vi.hoisted(() => ({
  createTenantStudioMock: vi.fn(),
}));
const { persistTenantSanityTokenMock } = vi.hoisted(() => ({
  persistTenantSanityTokenMock: vi.fn(),
}));
const { mapTenantDomainMock } = vi.hoisted(() => ({
  mapTenantDomainMock: vi.fn(),
}));
const { createTenantRevalidateWebhookMock } = vi.hoisted(() => ({
  createTenantRevalidateWebhookMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  reactivateTenant: reactivateTenantMock,
}));
vi.mock('./lib/report-step-status', () => ({
  reportStepStatus: reportStepStatusMock,
}));
vi.mock('./steps/create-sanity-project', () => ({
  createTenantSanityProject: createTenantSanityProjectMock,
}));
vi.mock('./steps/seed-content', () => ({
  seedTenantContent: seedTenantContentMock,
}));
vi.mock('./steps/create-studio-vercel-project', () => ({
  createTenantStudio: createTenantStudioMock,
}));
vi.mock('./steps/persist-sanity-token', () => ({
  persistTenantSanityToken: persistTenantSanityTokenMock,
}));
vi.mock('./steps/map-domain', () => ({
  mapTenantDomain: mapTenantDomainMock,
}));
vi.mock('./steps/create-revalidate-webhook', () => ({
  createTenantRevalidateWebhook: createTenantRevalidateWebhookMock,
}));

const fetchMock = vi.fn();

const reprovisionedTenant = {
  id: 'tenant-1',
  name: 'Acme',
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  sanityProjectId: 'proj123',
} as TTenant;

const env = {
  sanityManagementToken: 'sanity-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'vercel-token',
  vercelOrgId: 'org-1',
  vercelTeamId: undefined,
  vercelWebProjectId: 'proj-1',
  vercelCliVersion: '48.0.0',
  adminAppBaseUrl: 'https://admin.example.com',
  platformDomain: 'example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
  githubRepository: 'acme/blog',
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
          isDisabledByUser: true,
        }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ isDisabledByUser: false }), {
        status: 200,
      }),
    );
  reactivateTenantMock
    .mockReset()
    .mockResolvedValue({ ok: true, data: reprovisionedTenant });
  reportStepStatusMock.mockReset().mockResolvedValue(undefined);
  createTenantSanityProjectMock.mockReset().mockResolvedValue({});
  seedTenantContentMock.mockReset().mockResolvedValue(undefined);
  createTenantStudioMock.mockReset().mockResolvedValue({});
  persistTenantSanityTokenMock.mockReset().mockResolvedValue(undefined);
  mapTenantDomainMock.mockReset().mockResolvedValue(undefined);
  createTenantRevalidateWebhookMock.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(runSteps, () => {
  it('un-archives the tenant Sanity project via isDisabledByUser and completes provisioning', async () => {
    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [patchUrl, patchInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(patchUrl).toBe('https://api.sanity.io/v2021-06-07/projects/proj123');
    expect(patchInit.method).toBe('PATCH');
    expect(patchInit.body).toBe(JSON.stringify({ isDisabledByUser: false }));

    expect(createTenantSanityProjectMock).toHaveBeenCalledTimes(1);
    expect(createTenantRevalidateWebhookMock).toHaveBeenCalledTimes(1);
  });

  it('does not PATCH again when the project is already un-archived', async () => {
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
      );

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createTenantSanityProjectMock).toHaveBeenCalledTimes(1);
  });
});
