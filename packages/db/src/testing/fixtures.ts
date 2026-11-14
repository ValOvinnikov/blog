import { LOCALE_ISO_CODES, TENANT_PLAN } from '@blog/config/constants';
import { ADMIN_ROLE, GRANTED_VIA, TENANT_STATUS } from '@blog/db/constants';
import {
  leadContentColumns,
  type TLeadContent,
} from '@blog/db/queries/leads/lead-content';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TUser } from '@blog/db/schema/auth';
import type { TLead } from '@blog/db/schema/leads';
import type { TSubscriber } from '@blog/db/schema/subscribers';
import type { TTenant } from '@blog/db/schema/tenants';
import { firstRowOrThrow } from '@blog/db/testing/first-row-or-throw';
import { MOCK_NOW } from '@blog/db/testing/frozen-clock';
import { createMockFaker } from '@blog/db/testing/mock-faker';
import { uniqueEmailColumns } from '@blog/db/utils/personal-data/personal-data';
import type { PGlite } from '@electric-sql/pglite';
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

  return firstRowOrThrow(
    await db
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
      .returning(),
    'insertTestTenant',
  );
}

export async function insertTestUser(
  db: TTestDb,
  overrides: Partial<typeof schema.users.$inferInsert> = {},
): Promise<TUser> {
  return firstRowOrThrow(
    await db.insert(schema.users).values(overrides).returning(),
    'insertTestUser',
  );
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
  return firstRowOrThrow(
    await db
      .insert(schema.subscribers)
      .values({
        tenantId,
        ...uniqueEmailColumns(email),
        ...overrides,
      })
      .returning(),
    'insertTestSubscriber',
  );
}

export async function insertTestAdmin(
  db: TTestDb,
  user: Partial<typeof schema.users.$inferInsert> = {},
): Promise<TAdmin> {
  const { id: userId } = await insertTestUser(db, user);

  return firstRowOrThrow(
    await db
      .insert(schema.admins)
      .values({
        userId,
        role: ADMIN_ROLE.ADMIN,
        grantedVia: GRANTED_VIA.PROMOTION,
      })
      .returning(),
    'insertTestAdmin',
  );
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
  return firstRowOrThrow(
    await db
      .insert(schema.leads)
      .values({
        tenantId,
        ...leadContentColumns({ name, email, message }),
        sourcePath: MOCK_LEAD_SOURCE_PATH,
        ...overrides,
      })
      .returning(),
    'insertTestLead',
  );
}
