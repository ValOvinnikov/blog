import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/config/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { runSteps } from './run';

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

vi.mock('./lib/status-callback', () => ({
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

const baseTenant = { id: 'tenant-1', name: 'Acme' } as TTenant;
const env = {
  sanityManagementToken: 'sanity-token',
  vercelToken: 'vercel-token',
  vercelOrgId: 'org-1',
  vercelTeamId: undefined,
  vercelWebProjectId: 'proj-1',
  vercelCliVersion: '48.0.0',
  adminAppBaseUrl: 'https://admin.example.com',
  callbackSecret: 'shh',
  platformDomain: 'example.com',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
};

beforeEach(() => {
  reportStepStatusMock.mockReset().mockResolvedValue(undefined);
  createTenantSanityProjectMock.mockReset();
  seedTenantContentMock.mockReset().mockResolvedValue(undefined);
  createTenantStudioMock.mockReset();
  persistTenantSanityTokenMock.mockReset().mockResolvedValue(undefined);
  mapTenantDomainMock.mockReset().mockResolvedValue(undefined);
  createTenantRevalidateWebhookMock.mockReset().mockResolvedValue(undefined);
});

describe(runSteps, () => {
  it('reports RUNNING then DONE for every step, in order, on a clean run', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    createTenantStudioMock.mockResolvedValue({});

    const result = await runSteps('tenant-1', baseTenant, env);

    expect(result).toEqual({ ok: true });
    expect(createTenantSanityProjectMock).toHaveBeenCalledTimes(1);
    expect(seedTenantContentMock).toHaveBeenCalledTimes(1);
    expect(createTenantStudioMock).toHaveBeenCalledTimes(1);
    expect(persistTenantSanityTokenMock).toHaveBeenCalledTimes(1);
    expect(mapTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(createTenantRevalidateWebhookMock).toHaveBeenCalledTimes(1);

    const statuses = reportStepStatusMock.mock.calls.map((call) => {
      const [input] = call as [{ step: string; status: string }];
      return [input.step, input.status];
    });
    expect(statuses).toEqual([
      [
        TENANT_PROVISIONING_STEP.SANITY_PROJECT,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.SANITY_PROJECT,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.SEED_CONTENT,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.SEED_CONTENT,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.DEPLOY_STUDIO,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.DEPLOY_STUDIO,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.MAP_DOMAIN,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.MAP_DOMAIN,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
    ]);
  });

  it('merges each step result into the tenant row passed to the next step', async () => {
    createTenantSanityProjectMock.mockResolvedValue({
      sanityProjectId: 'proj-abc',
    });
    createTenantStudioMock.mockResolvedValue({
      studioVercelProjectId: 'studio-abc',
    });

    await runSteps('tenant-1', baseTenant, env);

    const [tenantSeenBySeed] = seedTenantContentMock.mock.calls[0] as [TTenant];
    expect(tenantSeenBySeed).toMatchObject({ sanityProjectId: 'proj-abc' });

    const [tenantSeenByPersist] = persistTenantSanityTokenMock.mock
      .calls[0] as [TTenant];
    expect(tenantSeenByPersist).toMatchObject({
      sanityProjectId: 'proj-abc',
      studioVercelProjectId: 'studio-abc',
    });
  });

  it('stops at the first failing step, reports FAILED, and never runs later steps', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    seedTenantContentMock.mockRejectedValue(new Error('seed failed'));

    const result = await runSteps('tenant-1', baseTenant, env);

    expect(result).toEqual({ ok: false });
    expect(createTenantStudioMock).not.toHaveBeenCalled();
    expect(persistTenantSanityTokenMock).not.toHaveBeenCalled();
    expect(mapTenantDomainMock).not.toHaveBeenCalled();
    expect(createTenantRevalidateWebhookMock).not.toHaveBeenCalled();

    const lastCall = reportStepStatusMock.mock.calls.at(-1) as [
      { step: string; status: string; error: string },
    ];
    expect(lastCall[0]).toMatchObject({
      step: TENANT_PROVISIONING_STEP.SEED_CONTENT,
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      error: 'seed failed',
    });
  });
});
