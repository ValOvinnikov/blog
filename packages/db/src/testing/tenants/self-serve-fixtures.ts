import { tenants } from '@blog/db/schema/tenants';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { testPersonalEmailIndex } from '@blog/db/testing/personal-data';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

const EMAIL_DOMAIN = faker.internet.domainName();
const OWNER_LOCAL_PART = faker.string.alpha({ length: 8 }).toLowerCase();

export const MOCK_SELF_SERVE_NAME = faker.company.name();
export const MOCK_SELF_SERVE_DOMAIN = faker.internet.domainName();
export const MOCK_SELF_SERVE_OTHER_DOMAIN = `other.${MOCK_SELF_SERVE_DOMAIN}`;
export const MOCK_SELF_SERVE_OWNER_ID = faker.string.uuid();
export const MOCK_SELF_SERVE_OTHER_USER_ID = faker.string.uuid();
export const MOCK_SELF_SERVE_MISSING_USER_ID = faker.string.uuid();
export const MOCK_SELF_SERVE_OWNER_EMAIL = `${OWNER_LOCAL_PART}@${EMAIL_DOMAIN}`;
export const MOCK_SELF_SERVE_OWNER_EMAIL_INDEX = testPersonalEmailIndex(
  MOCK_SELF_SERVE_OWNER_EMAIL,
);
export const MOCK_SELF_SERVE_OWNER_TAGGED_EMAIL = `${OWNER_LOCAL_PART}+promo@${EMAIL_DOMAIN}`;
export const MOCK_SELF_SERVE_OWNER_SHOUTED_EMAIL = ` ${MOCK_SELF_SERVE_OWNER_EMAIL.toUpperCase()}`;
export const MOCK_SELF_SERVE_OTHER_EMAIL = `${faker.string.alpha({ length: 9 }).toLowerCase()}@${EMAIL_DOMAIN}`;
export const MOCK_SELF_SERVE_SCHEME_DOMAIN = `https://${MOCK_SELF_SERVE_DOMAIN}`;
export const MOCK_SELF_SERVE_PADDED_DOMAIN = ` ${MOCK_SELF_SERVE_DOMAIN} `;

export async function readSelfServeIndex(db: TTestDb, tenantId: string) {
  const [row] = await db
    .select({ selfServeOwnerEmailIndex: tenants.selfServeOwnerEmailIndex })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return row?.selfServeOwnerEmailIndex;
}
