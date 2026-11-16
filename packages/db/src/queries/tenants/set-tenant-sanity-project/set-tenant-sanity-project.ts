import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TSetTenantSanityProjectInput = {
  sanityProjectId: string;
  sanityDataset: string;
};

export async function setTenantSanityProject(
  tenantId: string,
  input: TSetTenantSanityProjectInput,
): Promise<void> {
  const db = getDb();

  await db
    .update(tenants)
    .set({
      sanityProjectId: input.sanityProjectId,
      sanityDataset: input.sanityDataset,
    })
    .where(eq(tenants.id, tenantId));
}
