import { getDb } from '@blog/db/client';
import { leads, type TLead } from '@blog/db/schema/leads';

export type TCreateLeadInput = Pick<
  TLead,
  'tenantId' | 'name' | 'email' | 'message' | 'sourcePath'
>;

export async function createLead(input: TCreateLeadInput): Promise<TLead> {
  const db = getDb();

  const [row] = await db.insert(leads).values(input).returning();

  if (!row) {
    throw new Error(
      `createLead: insert for tenant "${input.tenantId}" returned no row.`,
    );
  }

  return row;
}
