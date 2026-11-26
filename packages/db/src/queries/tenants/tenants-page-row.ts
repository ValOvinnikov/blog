import type { TMaybeNull } from '@shinefold/config/types';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';

export type TTenantsPageRow = Pick<
  TTenant,
  | 'id'
  | 'name'
  | 'primaryDomain'
  | 'plan'
  | 'status'
  | 'provisioningStatus'
  | 'deprovisionedAt'
  | 'createdAt'
> & { matchedDomain?: string };

export const tenantsPageRowColumns = {
  id: tenants.id,
  name: tenants.name,
  primaryDomain: tenants.primaryDomain,
  plan: tenants.plan,
  status: tenants.status,
  provisioningStatus: tenants.provisioningStatus,
  deprovisionedAt: tenants.deprovisionedAt,
  createdAt: tenants.createdAt,
};

export function toTenantsPageRow({
  matchedDomain,
  ...row
}: Omit<TTenantsPageRow, 'matchedDomain'> & {
  matchedDomain?: TMaybeNull<string>;
}): TTenantsPageRow {
  return {
    id: row.id,
    name: row.name,
    primaryDomain: row.primaryDomain,
    plan: row.plan,
    status: row.status,
    provisioningStatus: row.provisioningStatus,
    deprovisionedAt: row.deprovisionedAt,
    createdAt: row.createdAt,
    matchedDomain: matchedDomain ?? undefined,
  };
}
