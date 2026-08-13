import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import {
  upsertSiteConfig,
  type TUpdateSiteConfigInput,
} from './upsert-site-config';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

const baseInput: TUpdateSiteConfigInput = {
  preset: PRESET_ID.CONSOLE,
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
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

describe(upsertSiteConfig, () => {
  it('inserts a new row when the tenant has no config yet', async () => {
    const tenantId = await insertTenant('acme');

    const result = await upsertSiteConfig(tenantId, baseInput);

    expect(result).toMatchObject({
      tenantId,
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      logoHue: undefined,
      voiceOverrides: {},
    });
  });

  it('updates the existing row in place rather than inserting a second one', async () => {
    const tenantId = await insertTenant('acme');
    await upsertSiteConfig(tenantId, baseInput);

    const result = await upsertSiteConfig(tenantId, {
      ...baseInput,
      preset: PRESET_ID.EDITORIAL,
      accentHue: 28,
    });

    expect(result.preset).toBe(PRESET_ID.EDITORIAL);
    expect(result.accentHue).toBe(28);
    const rows = await db.select().from(schema.siteConfig);
    expect(rows).toHaveLength(1);
  });

  it('stores curated voice overrides', async () => {
    const tenantId = await insertTenant('acme');

    const result = await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverrides: {
        notFoundDescription: "That route doesn't resolve to anything here.",
        bookmarkToastSavedMessage: 'stashed to ~/bookmarks',
      },
    });

    expect(result.voiceOverrides).toEqual({
      notFoundDescription: "That route doesn't resolve to anything here.",
      bookmarkToastSavedMessage: 'stashed to ~/bookmarks',
    });
  });

  // The single most important behaviour in this module: an emptied override
  // field must end up absent from the stored JSONB, never a literal `''` —
  // storing `''` would silently break the "blank falls through to the
  // preset default" ladder for anyone who clears a field.
  it('clears a previously-set voice override when resubmitted blank', async () => {
    const tenantId = await insertTenant('acme');
    await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverrides: { notFoundDescription: 'Custom description.' },
    });

    const result = await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverrides: { notFoundDescription: '' },
    });

    expect(result.voiceOverrides).toEqual({});
    expect(
      Object.prototype.hasOwnProperty.call(
        result.voiceOverrides,
        'notFoundDescription',
      ),
    ).toBe(false);
  });

  it('trims a whitespace-only override to the same cleared state as blank', async () => {
    const tenantId = await insertTenant('acme');

    const result = await upsertSiteConfig(tenantId, {
      ...baseInput,
      voiceOverrides: { terminalPromptHost: '   ' },
    });

    expect(result.voiceOverrides).toEqual({});
  });

  it('rejects an accentHue outside the 0–360 range', async () => {
    const tenantId = await insertTenant('acme');

    await expect(
      upsertSiteConfig(tenantId, { ...baseInput, accentHue: 400 }),
    ).rejects.toThrow();
  });

  it('rejects a voice override longer than its field-specific cap', async () => {
    const tenantId = await insertTenant('acme');

    await expect(
      upsertSiteConfig(tenantId, {
        ...baseInput,
        voiceOverrides: { terminalPromptHost: 'x'.repeat(101) },
      }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertSiteConfig('00000000-0000-0000-0000-000000000000', baseInput),
    ).rejects.toThrow();
  });
});
