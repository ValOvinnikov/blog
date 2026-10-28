import { getDb } from '@blog/db/client';
import {
  leadContentColumns,
  type TLeadContent,
} from '@blog/db/queries/leads/lead-content';
import { leads, type TLead } from '@blog/db/schema/leads';

export type TCreateLeadInput = Pick<TLead, 'tenantId' | 'sourcePath'> &
  TLeadContent &
  Partial<Pick<TLead, 'sourceDocumentId' | 'sourceLocale'>>;

export async function createLead(
  input: TCreateLeadInput,
): Promise<Pick<TLead, 'id'>> {
  const db = getDb();
  const { name, email, message, ...lead } = input;

  const [row] = await db
    .insert(leads)
    .values({ ...lead, ...leadContentColumns({ name, email, message }) })
    .returning({ id: leads.id });

  if (!row) {
    throw new Error(
      `createLead: insert for tenant "${input.tenantId}" returned no row.`,
    );
  }

  return row;
}
