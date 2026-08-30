import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TUser } from '@blog/db/schema/auth';
import type { TTenant } from '@blog/db/schema/tenants';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

export type TTestDb = PgliteDatabase<typeof schema>;

// Seeds one `tenants` row against the given `createTestDb()` instance for a
// test's `beforeEach`/setup — `slug` (and the fields derived from it) default
// to a fresh random value so unrelated tests never collide on the unique
// `slug` constraint; pass any `tenants` column to override a default.
export async function insertTestTenant(
  db: TTestDb,
  overrides: Partial<typeof schema.tenants.$inferInsert> = {},
): Promise<TTenant> {
  const slug = overrides.slug ?? `tenant-${crypto.randomUUID()}`;

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
      ...overrides,
    })
    .returning();

  if (!tenant) throw new Error('insertTestTenant: insert returned no row.');

  return tenant;
}

// Seeds one `users` row — every field is optional (matching how little
// Auth.js guarantees is populated), so pass `id`/`email`/etc. explicitly
// whenever a test asserts against them.
export async function insertTestUser(
  db: TTestDb,
  overrides: Partial<typeof schema.users.$inferInsert> = {},
): Promise<TUser> {
  const [user] = await db.insert(schema.users).values(overrides).returning();

  if (!user) throw new Error('insertTestUser: insert returned no row.');

  return user;
}

// Seeds one `accounts` row linking `userId` to an OAuth `provider` — the
// shape every account-linking test needs, never a bare token/session row.
export async function insertTestAccount(
  db: TTestDb,
  userId: string,
  provider: string,
): Promise<void> {
  await db.insert(schema.accounts).values({
    userId,
    type: 'oauth',
    provider,
    providerAccountId: `${userId}-${provider}`,
  });
}
