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
import {
  leadContentColumns,
  type TLeadContent,
} from '@blog/db/queries/leads/lead-content';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import type { TUser } from '@blog/db/schema/auth';
import type { TLead } from '@blog/db/schema/leads';
import type { TSubscriber } from '@blog/db/schema/subscribers';
import type { TTenant } from '@blog/db/schema/tenants';
import { MOCK_NOW } from '@blog/db/testing/frozen-clock';
import { createMockFaker } from '@blog/db/testing/mock-faker';
import { uniqueEmailColumns } from '@blog/db/utils/personal-data/personal-data';
import type { PGlite } from '@electric-sql/pglite';
import { faker } from '@faker-js/faker';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

export type TTestDb = PgliteDatabase<typeof schema> & { $client: PGlite };

const fixturesFaker = createMockFaker(60223);

export const MOCK_SUBSCRIBER_EMAIL = fixturesFaker.internet
  .email()
  .toLowerCase();
export const MOCK_SUBSCRIBER_TAGGED_EMAIL = MOCK_SUBSCRIBER_EMAIL.replace(
  /@/,
  '+news@',
);
export const MOCK_INVITE_EMAIL = fixturesFaker.internet.email().toLowerCase();
export const MOCK_LEAD_NAME = fixturesFaker.person.fullName();
export const MOCK_LEAD_EMAIL = fixturesFaker.internet.email().toLowerCase();
export const MOCK_LEAD_MESSAGE = fixturesFaker.lorem.sentence();
export const MOCK_LEAD_READ_AT = fixturesFaker.date.past({ refDate: MOCK_NOW });
export const MOCK_USER_NAME = fixturesFaker.person.fullName();
export const MOCK_USER_EMAIL = fixturesFaker.internet.email().toLowerCase();
export const MOCK_OWNER_EMAIL = fixturesFaker.internet.email().toLowerCase();
export const MOCK_OPERATOR_EMAIL = fixturesFaker.internet.email().toLowerCase();
export const MOCK_EMAIL_VERIFIED_AT = fixturesFaker.date.past({
  refDate: MOCK_NOW,
});
const MOCK_LEAD_SOURCE_PATH = `/${fixturesFaker.lorem.slug()}`;

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
  return insertTestUser(db, userPersonalColumns({ email }));
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
      ...uniqueEmailColumns(email),
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
  {
    name = MOCK_LEAD_NAME,
    email = MOCK_LEAD_EMAIL,
    message = MOCK_LEAD_MESSAGE,
    ...overrides
  }: Partial<typeof schema.leads.$inferInsert & TLeadContent> = {},
): Promise<TLead> {
  const [lead] = await db
    .insert(schema.leads)
    .values({
      tenantId,
      ...leadContentColumns({ name, email, message }),
      sourcePath: MOCK_LEAD_SOURCE_PATH,
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
