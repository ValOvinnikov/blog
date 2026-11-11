import { WRITABLE_TENANT_STATUSES } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { isOneOf } from '@blog/utils/primitives';

export function isTenantWritable({
  status,
  deprovisionedAt,
}: Pick<TTenant, 'status' | 'deprovisionedAt'>): boolean {
  return isOneOf(WRITABLE_TENANT_STATUSES, status) && !deprovisionedAt;
}
