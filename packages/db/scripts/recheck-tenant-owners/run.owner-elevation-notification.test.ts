import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { runSteps } from '../provision-tenant/run';

import { runRecheck } from './run';

/**
 * Exercises `provision-tenant/run.ts` and `recheck-tenant-owners/run.ts`
 * together, against the same tenant row in a real Postgres, to cover the
 * de-dup boundary between a provisioning-time owner-elevation notification
 * and the first sweep that follows it — a defect only visible across both
 * entrypoints, never inside either one in isolation.
 */

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const { elevateTenantOwnerMock } = vi.hoisted(() => ({
  elevateTenantOwnerMock: vi.fn(),
}));
vi.mock('../provision-tenant/steps/elevate-tenant-owner', () => ({
  elevateTenantOwner: elevateTenantOwnerMock,
}));

const { createTenantSanityProjectMock } = vi.hoisted(() => ({
  createTenantSanityProjectMock: vi.fn(),
}));
vi.mock('../provision-tenant/steps/create-sanity-project', () => ({
  createTenantSanityProject: createTenantSanityProjectMock,
}));
const { seedTenantContentMock } = vi.hoisted(() => ({
  seedTenantContentMock: vi.fn(),
}));
vi.mock('../provision-tenant/steps/seed-content', () => ({
  seedTenantContent: seedTenantContentMock,
}));
const { persistTenantSanityTokenMock } = vi.hoisted(() => ({
  persistTenantSanityTokenMock: vi.fn(),
}));
vi.mock('../provision-tenant/steps/persist-sanity-token', () => ({
  persistTenantSanityToken: persistTenantSanityTokenMock,
}));
const { mapTenantDomainMock } = vi.hoisted(() => ({
  mapTenantDomainMock: vi.fn(),
}));
vi.mock('../provision-tenant/steps/map-domain', () => ({
  mapTenantDomain: mapTenantDomainMock,
}));
const { createTenantRevalidateWebhookMock } = vi.hoisted(() => ({
  createTenantRevalidateWebhookMock: vi.fn(),
}));
vi.mock('../provision-tenant/steps/create-revalidate-webhook', () => ({
  createTenantRevalidateWebhook: createTenantRevalidateWebhookMock,
}));

const { notifyOperatorsOfOwnerElevationOutcomeMock } = vi.hoisted(() => ({
  notifyOperatorsOfOwnerElevationOutcomeMock: vi.fn(),
}));
vi.mock('./lib/notify-operators', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./lib/notify-operators')>();
  return {
    ...actual,
    notifyOperatorsOfOwnerElevationOutcome:
      notifyOperatorsOfOwnerElevationOutcomeMock,
  };
});

const { listTenantsPendingOwnerElevationMock } = vi.hoisted(() => ({
  listTenantsPendingOwnerElevationMock: vi.fn(),
}));
vi.mock('@blog/db/queries/tenants', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@blog/db/queries/tenants')>();
  return {
    ...actual,
    listTenantsPendingOwnerElevation: listTenantsPendingOwnerElevationMock,
  };
});

let db: PgliteDatabase<typeof schema>;

async function insertActiveTenant(): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: 'PENDING',
      provisioningSteps: {
        SANITY_PROJECT: { status: 'IDLE' },
        SEED_CONTENT: { status: 'IDLE' },
        PERSIST_TOKEN: { status: 'IDLE' },
        MAP_DOMAIN: { status: 'IDLE' },
        CREATE_WEBHOOK: { status: 'IDLE' },
        OWNER_ELEVATION: { status: 'IDLE' },
      },
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  return tenant.id;
}

async function loadTenant(tenantId: string) {
  const [tenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId));

  if (!tenant) throw new Error('setup: tenant not found.');

  return tenant;
}

const provisionEnv = {
  sanityManagementToken: 'sanity-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'vercel-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'proj-1',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
  githubRunId: undefined,
  githubRepository: undefined,
  githubServerUrl: undefined,
  githubActor: undefined,
  tenantRegistryEnvironment: undefined,
  resendApiKey: 'resend-key',
};

const recheckEnv = {
  sanityManagementToken: 'sanity-token',
  resendApiKey: 'resend-key',
};

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
  createTenantSanityProjectMock.mockReset().mockResolvedValue({});
  seedTenantContentMock.mockReset().mockResolvedValue(undefined);
  persistTenantSanityTokenMock.mockReset().mockResolvedValue(undefined);
  mapTenantDomainMock.mockReset().mockResolvedValue(undefined);
  createTenantRevalidateWebhookMock.mockReset().mockResolvedValue(undefined);
  elevateTenantOwnerMock.mockReset();
  notifyOperatorsOfOwnerElevationOutcomeMock
    .mockReset()
    .mockResolvedValue(undefined);
  listTenantsPendingOwnerElevationMock.mockReset();
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe('owner-elevation notification across provision-tenant and recheck-tenant-owners', () => {
  it('notifies operators exactly once for an outcome notifiable at provisioning time, and the next sweep stays silent', async () => {
    const tenantId = await insertActiveTenant();
    elevateTenantOwnerMock.mockResolvedValue('STALLED');

    const provisionResult = await runSteps(tenantId, provisionEnv);
    expect(provisionResult).toEqual({ ok: true });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'STALLED' }),
    );

    const provisionedTenant = await loadTenant(tenantId);
    expect(provisionedTenant.lastNotifiedOwnerElevationOutcome).toBe('STALLED');

    listTenantsPendingOwnerElevationMock.mockResolvedValue([provisionedTenant]);

    const summary = await runRecheck(recheckEnv);
    expect(summary.stalled).toBe(1);

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
  });

  it('notifies again on the next sweep once the outcome actually changes', async () => {
    const tenantId = await insertActiveTenant();
    elevateTenantOwnerMock.mockResolvedValue('STALLED');

    await runSteps(tenantId, provisionEnv);
    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);

    const provisionedTenant = await loadTenant(tenantId);
    listTenantsPendingOwnerElevationMock.mockResolvedValue([provisionedTenant]);
    elevateTenantOwnerMock.mockResolvedValue('AMBIGUOUS_MEMBERSHIP');

    const summary = await runRecheck(recheckEnv);
    expect(summary.ambiguous).toBe(1);

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(2);
    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ outcome: 'AMBIGUOUS_MEMBERSHIP' }),
    );
  });
});
