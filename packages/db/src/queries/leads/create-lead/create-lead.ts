import { getDb } from '@blog/db/client';
import { leads, type TLead } from '@blog/db/schema/leads';
import {
  encryptPersonalValue,
  personalEmailColumns,
} from '@blog/db/utils/personal-data/personal-data';

export type TCreateLeadInput = Pick<
  TLead,
  'tenantId' | 'name' | 'email' | 'message' | 'sourcePath'
>;

export async function createLead(input: TCreateLeadInput): Promise<TLead> {
  const db = getDb();
  const { name, email, message } = input;

  const [row] = await db
    .insert(leads)
    .values({
      ...input,
      nameEncrypted: encryptPersonalValue(name),
      ...personalEmailColumns(email),
      messageEncrypted: encryptPersonalValue(message),
    })
    .returning();

  if (!row) {
    throw new Error(
      `createLead: insert for tenant "${input.tenantId}" returned no row.`,
    );
  }

  return row;
}
