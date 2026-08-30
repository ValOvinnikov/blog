import { PRESET_ID } from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { deleteTenant } from './delete-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(
  options: {
    archived?: boolean;
    slug?: string;
    sanityProjectId?: string;
  } = {},
): Promise<string> {
  const { archived = true, slug = 'acme', sanityProjectId } = options;

  const tenant = await insertTestTenant(db, {
    slug,
    name: 'Acme',
    status: archived ? TENANT_STATUS.ARCHIVED : TENANT_STATUS.ACTIVE,
    deprovisionedAt: archived ? new Date() : undefined,
    sanityProjectId,
  });

  return tenant.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.siteConfig);
  await db.delete(schema.tenantDomains);
  await db.delete(schema.bookmarks);
  await db.delete(schema.subscribers);
  await db.delete(schema.memberships);
  await db.delete(schema.users);
  await db.delete(schema.tenants);
});

describe(deleteTenant, () => {
  it('deletes an archived tenant row', async () => {
    const tenantId = await insertTenant({ archived: true });

    const result = await deleteTenant(tenantId);

    expect(result).toEqual({ outcome: 'deleted', sanityProject: 'no-project' });

    const remaining = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(remaining).toEqual([]);
  });

  it('refuses to delete a tenant that is not archived, and the row survives', async () => {
    const tenantId = await insertTenant({ archived: false });

    const result = await deleteTenant(tenantId);

    expect(result).toEqual({ outcome: 'not-archived' });

    const remaining = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(remaining).toHaveLength(1);
  });

  it('returns not-found for a tenant id that does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    const result = await deleteTenant(missingId);

    expect(result).toEqual({ outcome: 'not-found' });
  });

  it('cascades to dependent membership and tenant_domains rows for that tenant', async () => {
    const tenantId = await insertTenant({ archived: true });
    await db.insert(schema.users).values({ id: 'user-1' });
    await db.insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });
    await db.insert(schema.tenantDomains).values({
      tenantId,
      domain: 'acme.example.com',
    });

    await deleteTenant(tenantId);

    const remainingMemberships = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, tenantId));
    expect(remainingMemberships).toEqual([]);

    const remainingDomains = await db
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.tenantId, tenantId));
    expect(remainingDomains).toEqual([]);
  });

  it('cascades to a dependent site_config row for that tenant', async () => {
    const tenantId = await insertTenant({ archived: true });
    await db.insert(schema.siteConfig).values({
      tenantId,
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      headingFont: 'SPACE_GROTESK',
      bodyFont: 'NEWSREADER',
      radiusScale: 'MD',
      density: 'DEFAULT',
    });

    await deleteTenant(tenantId);

    const remainingSiteConfig = await db
      .select()
      .from(schema.siteConfig)
      .where(eq(schema.siteConfig.tenantId, tenantId));
    expect(remainingSiteConfig).toEqual([]);
  });

  it('cascades to dependent subscriber and bookmark rows for that tenant', async () => {
    const tenantId = await insertTenant({ archived: true });
    await db.insert(schema.users).values({ id: 'user-1' });
    await db.insert(schema.subscribers).values({
      tenantId,
      email: 'reader@example.com',
    });
    await db.insert(schema.bookmarks).values({
      tenantId,
      userId: 'user-1',
      postId: 'post-1',
    });

    await deleteTenant(tenantId);

    const remainingSubscribers = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.tenantId, tenantId));
    expect(remainingSubscribers).toEqual([]);

    const remainingBookmarks = await db
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.tenantId, tenantId));
    expect(remainingBookmarks).toEqual([]);
  });

  it('frees the slug for a new tenant after a successful delete', async () => {
    const tenantId = await insertTenant({ archived: true, slug: 'acme' });

    await deleteTenant(tenantId);

    const [newTenant] = await db
      .insert(schema.tenants)
      .values({
        slug: 'acme',
        name: 'Acme Reborn',
        primaryDomain: 'acme-reborn.example.com',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      })
      .returning();

    expect(newTenant?.slug).toBe('acme');
  });
});

describe('deleteTenant — Sanity project deletion', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not attempt Sanity deletion when no token is supplied', async () => {
    const tenantId = await insertTenant({
      archived: true,
      sanityProjectId: 'proj123',
    });

    const result = await deleteTenant(tenantId);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: 'deleted',
      sanityProject: 'skipped-no-token',
    });
  });

  it('reports no-project when the tenant never had one, even with a token supplied', async () => {
    const tenantId = await insertTenant({ archived: true });

    const result = await deleteTenant(tenantId, 'mgmt-token');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'deleted', sanityProject: 'no-project' });
  });

  it('deletes the Sanity project when a token is supplied and the API succeeds', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const tenantId = await insertTenant({
      archived: true,
      sanityProjectId: 'proj123',
    });

    const result = await deleteTenant(tenantId, 'mgmt-token');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sanity.io/v2021-06-07/projects/proj123');
    expect(init.method).toBe('DELETE');
    expect(result).toEqual({ outcome: 'deleted', sanityProject: 'deleted' });
  });

  it('reports already-gone (not deleted) and still hard-deletes the row on a 404', async () => {
    fetchMock.mockResolvedValue(new Response('not found', { status: 404 }));
    const tenantId = await insertTenant({
      archived: true,
      sanityProjectId: 'proj123',
    });

    const result = await deleteTenant(tenantId, 'mgmt-token');

    expect(result).toEqual({
      outcome: 'deleted',
      sanityProject: 'already-gone',
    });

    const remaining = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(remaining).toEqual([]);
  });

  it('still hard-deletes the row and reports left-archived on the org-billing 401', async () => {
    fetchMock.mockResolvedValue(
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
    const tenantId = await insertTenant({
      archived: true,
      sanityProjectId: 'proj123',
    });

    const result = await deleteTenant(tenantId, 'mgmt-token');

    expect(result).toEqual({
      outcome: 'deleted',
      sanityProject: 'left-archived',
    });

    const remaining = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(remaining).toEqual([]);
  });

  it('still throws on a Sanity failure unrelated to billing permission, and leaves the row untouched', async () => {
    fetchMock.mockResolvedValue(new Response('forbidden', { status: 403 }));
    const tenantId = await insertTenant({
      archived: true,
      sanityProjectId: 'proj123',
    });

    await expect(deleteTenant(tenantId, 'mgmt-token')).rejects.toThrow(/403/);

    const remaining = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(remaining).toHaveLength(1);
  });
});
