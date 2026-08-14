import { PRESET_ID, TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getSiteConfig } from './get-site-config';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: slug,
      primaryDomain: `${slug}.example.com`,
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  return tenant!.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.siteConfig);
  await db.delete(schema.tenants);
});

describe(getSiteConfig, () => {
  it('returns undefined when the tenant has no config row', async () => {
    const tenantId = await insertTenant('acme');

    const result = await getSiteConfig(tenantId);

    expect(result).toBeUndefined();
  });

  it('maps null theme columns to undefined', async () => {
    const tenantId = await insertTenant('acme');
    await db.insert(schema.siteConfig).values({
      tenantId,
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      headingFont: 'SPACE_GROTESK',
      bodyFont: 'NEWSREADER',
      radiusScale: 'MD',
      density: 'DEFAULT',
    });

    const result = await getSiteConfig(tenantId);

    expect(result).toMatchObject({
      tenantId,
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      logoHue: undefined,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: {},
    });
  });
});
