import { getDb } from '@blog/db/client';
import type { TSuspensionCategory } from '@blog/db/constants';
import {
  tenantSuspensions,
  type TTenantSuspension,
} from '@blog/db/schema/tenant-suspensions';

export type TOpenTenantSuspensionInput = {
  tenantId: string;
  category: TSuspensionCategory;
  description: string;
  suspendedBy: string;
};

export async function openTenantSuspension(
  input: TOpenTenantSuspensionInput,
): Promise<TTenantSuspension> {
  const [suspension] = await getDb()
    .insert(tenantSuspensions)
    .values(input)
    .returning();

  if (!suspension) {
    throw new Error('openTenantSuspension: insert returned no row.');
  }

  return suspension;
}
