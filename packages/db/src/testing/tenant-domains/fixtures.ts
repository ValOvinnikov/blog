import * as schema from '@shinefold/db/schema';
import type { TTenantDomain } from '@shinefold/db/schema/tenant-domains';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import type { TTestDb } from '@shinefold/db/testing/fixtures';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';

export const MOCK_WWW_TENANT_DOMAIN = `www.${MOCK_TENANT_DOMAIN}`;
export const MOCK_OTHER_TENANT_DOMAIN = `other.${MOCK_TENANT_DOMAIN}`;
export const MOCK_SHARED_TENANT_DOMAIN = `shared.${MOCK_TENANT_DOMAIN}`;
export const MOCK_MISSING_TENANT_DOMAIN = `missing.${MOCK_TENANT_DOMAIN}`;
export const MOCK_MARKETING_TENANT_DOMAIN = `marketing.${MOCK_TENANT_DOMAIN}`;

export async function insertTestTenantDomain(
  db: TTestDb,
  tenantId: string,
  domain: string,
): Promise<TTenantDomain> {
  return firstRowOrThrow(
    await db
      .insert(schema.tenantDomains)
      .values({ tenantId, domain })
      .returning(),
    'insertTestTenantDomain',
  );
}
