import * as schema from '@blog/db/schema';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { MOCK_SHARED_TENANT_DOMAIN } from '@blog/db/testing/tenant-domains/fixtures';

export async function insertTestCustomDomainClaim(
  db: TTestDb,
  overrides: Pick<typeof schema.customDomainClaims.$inferInsert, 'tenantId'> &
    Partial<typeof schema.customDomainClaims.$inferInsert>,
): Promise<typeof schema.customDomainClaims.$inferSelect> {
  const [claim] = await db
    .insert(schema.customDomainClaims)
    .values({
      domain: MOCK_SHARED_TENANT_DOMAIN,
      token: `token-${overrides.tenantId}`,
      ...overrides,
    })
    .returning();

  if (!claim) {
    throw new Error('insertTestCustomDomainClaim: insert returned no row.');
  }

  return claim;
}
