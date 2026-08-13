import { getDb } from '@blog/db/client';
import {
  tenantDomains,
  type TTenantDomain,
} from '@blog/db/schema/tenant-domains';
import { eq } from 'drizzle-orm';

// Adds a domain to a tenant. Idempotent for the exact same (tenantId,
// domain) pair — matches `addBookmark`'s insert-first shape, since `domain`
// is globally unique so a racy double-insert would otherwise throw. A
// domain already claimed by a *different* tenant is a genuine conflict, not
// a no-op, so that case throws distinctly rather than silently returning
// someone else's row.
export async function addTenantDomain(
  tenantId: string,
  domain: string,
): Promise<TTenantDomain> {
  const db = getDb();

  const [inserted] = await db
    .insert(tenantDomains)
    .values({ tenantId, domain })
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  const [existing] = await db
    .select()
    .from(tenantDomains)
    .where(eq(tenantDomains.domain, domain));

  if (!existing) {
    throw new Error(
      `addTenantDomain: expected an existing row for domain "${domain}" after a no-op insert.`,
    );
  }

  if (existing.tenantId !== tenantId) {
    throw new Error(
      `addTenantDomain: domain "${domain}" is already assigned to a different tenant.`,
    );
  }

  return existing;
}
