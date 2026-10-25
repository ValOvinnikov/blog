import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  LOCALE_ISO_CODES,
} from '@blog/config/constants';
import {
  ADMIN_ROLE,
  GRANTED_VIA,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import type { TUser } from '@blog/db/schema/auth';
import type { TLead } from '@blog/db/schema/leads';
import type { TSubscriber } from '@blog/db/schema/subscribers';
import type { TTenant } from '@blog/db/schema/tenants';
import { emailColumns } from '@blog/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@blog/utils/encryption';
import { faker } from '@faker-js/faker';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

export type TTestDb = PgliteDatabase<typeof schema>;

export const MOCK_SUBSCRIBER_EMAIL = faker.internet.email().toLowerCase();
export const MOCK_SUBSCRIBER_TAGGED_EMAIL = MOCK_SUBSCRIBER_EMAIL.replace(
  /@/,
  '+news@',
);
export const MOCK_INVITE_EMAIL = faker.internet.email().toLowerCase();
export const MOCK_LEAD_NAME = 'Ada Lovelace';
export const MOCK_LEAD_EMAIL = 'lead@example.com';
export const MOCK_LEAD_MESSAGE = 'I would like to talk about a project.';
export const MOCK_LEAD_READ_AT = faker.date.past();
export const MOCK_USER_NAME = faker.person.fullName();
export const MOCK_USER_EMAIL = faker.internet.email().toLowerCase();
export const MOCK_OWNER_EMAIL = faker.internet.email().toLowerCase();
export const MOCK_OPERATOR_EMAIL = 'operator@example.com';

// Seeds one `tenants` row against the given `createTestDb()` instance for a
// test's `beforeEach`/setup — `name`/`primaryDomain`/`sanityProjectId`
// (unique-indexed) each default to a fresh random value so unrelated tests
// never collide; pass any `tenants` column to override a default, or
// `sanityProjectId: null` for a still-provisioning tenant.
export async function insertTestTenant(
  db: TTestDb,
  overrides: Partial<typeof schema.tenants.$inferInsert> = {},
): Promise<TTenant> {
  const key = overrides.name ?? `tenant-${crypto.randomUUID()}`;

  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: key,
      primaryDomain: `${key}.example.com`,
      sanityProjectId: `sanity-${crypto.randomUUID()}`,
      sanityDataset: 'production',
      locale: LOCALE_ISO_CODES.EN,
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

export async function insertTestReader(
  db: TTestDb,
  email: string,
): Promise<TUser> {
  return insertTestUser(db, { email, ...userPersonalColumns({ email }) });
}

export async function insertTestSubscriber(
  db: TTestDb,
  tenantId: string,
  email: string,
  overrides: Partial<typeof schema.subscribers.$inferInsert> = {},
): Promise<TSubscriber> {
  const [subscriber] = await db
    .insert(schema.subscribers)
    .values({
      tenantId,
      email,
      ...emailColumns(email, personalDataIndex),
      ...overrides,
    })
    .returning();

  if (!subscriber) {
    throw new Error('insertTestSubscriber: insert returned no row.');
  }

  return subscriber;
}

export async function insertTestAdmin(db: TTestDb): Promise<TAdmin> {
  const { id: userId } = await insertTestUser(db);

  const [admin] = await db
    .insert(schema.admins)
    .values({
      userId,
      role: ADMIN_ROLE.ADMIN,
      grantedVia: GRANTED_VIA.PROMOTION,
    })
    .returning();

  if (!admin) throw new Error('insertTestAdmin: insert returned no row.');

  return admin;
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

export async function insertTestLead(
  db: TTestDb,
  tenantId: string,
  overrides: Partial<typeof schema.leads.$inferInsert> = {},
): Promise<TLead> {
  const [lead] = await db
    .insert(schema.leads)
    .values({
      tenantId,
      name: MOCK_LEAD_NAME,
      email: MOCK_LEAD_EMAIL,
      message: MOCK_LEAD_MESSAGE,
      sourcePath: '/en/hire-me',
      ...overrides,
    })
    .returning();

  if (!lead) throw new Error('insertTestLead: insert returned no row.');

  return lead;
}

export async function insertTestAuditEvent(
  db: TTestDb,
  overrides: Partial<typeof schema.auditEvents.$inferInsert> = {},
): Promise<TAuditEvent> {
  const [auditEvent] = await db
    .insert(schema.auditEvents)
    .values({
      actorId: faker.string.uuid(),
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: faker.string.uuid(),
      ...overrides,
    })
    .returning();

  if (!auditEvent) {
    throw new Error('insertTestAuditEvent: insert returned no row.');
  }

  return auditEvent;
}
