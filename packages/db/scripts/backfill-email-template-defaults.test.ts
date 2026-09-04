import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { backfillEmailTemplateDefaults } from './backfill-email-template-defaults';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
const { seedEmailTemplateDefaultsMock } = vi.hoisted(() => ({
  seedEmailTemplateDefaultsMock: vi.fn(),
}));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));
vi.mock('@blog/db/queries/email-templates', () => ({
  seedEmailTemplateDefaults: seedEmailTemplateDefaultsMock,
}));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
  seedEmailTemplateDefaultsMock.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

const baseTenant = {
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'p1',
  sanityDataset: 'production',
  locale: 'en',
  plan: TENANT_PLAN.FREE,
};

describe(backfillEmailTemplateDefaults, () => {
  it('seeds every active, non-deprovisioned tenant when not a dry run', async () => {
    await db.insert(schema.tenants).values([
      { ...baseTenant, name: 'Acme', status: TENANT_STATUS.ACTIVE },
      { ...baseTenant, name: 'Beta', status: TENANT_STATUS.ACTIVE },
    ]);

    const count = await backfillEmailTemplateDefaults(false);

    expect(count).toBe(2);
    expect(seedEmailTemplateDefaultsMock).toHaveBeenCalledTimes(2);
  });

  it('never seeds a suspended tenant', async () => {
    await db.insert(schema.tenants).values([
      { ...baseTenant, name: 'Acme', status: TENANT_STATUS.ACTIVE },
      { ...baseTenant, name: 'Beta', status: TENANT_STATUS.SUSPENDED },
    ]);

    const count = await backfillEmailTemplateDefaults(false);

    expect(count).toBe(1);
    expect(seedEmailTemplateDefaultsMock).toHaveBeenCalledTimes(1);
  });

  it('never seeds a deprovisioned tenant even if status still reads ACTIVE', async () => {
    await db.insert(schema.tenants).values({
      ...baseTenant,
      name: 'Acme',
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: new Date(),
    });

    const count = await backfillEmailTemplateDefaults(false);

    expect(count).toBe(0);
    expect(seedEmailTemplateDefaultsMock).not.toHaveBeenCalled();
  });

  it('reports tenants without writing anything on a dry run', async () => {
    await db
      .insert(schema.tenants)
      .values({ ...baseTenant, name: 'Acme', status: TENANT_STATUS.ACTIVE });

    const count = await backfillEmailTemplateDefaults(true);

    expect(count).toBe(1);
    expect(seedEmailTemplateDefaultsMock).not.toHaveBeenCalled();
  });

  it('returns 0 and writes nothing when there are no tenants', async () => {
    const count = await backfillEmailTemplateDefaults(false);

    expect(count).toBe(0);
    expect(seedEmailTemplateDefaultsMock).not.toHaveBeenCalled();
  });
});
