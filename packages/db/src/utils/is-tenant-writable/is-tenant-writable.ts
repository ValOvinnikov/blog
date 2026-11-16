import { WRITABLE_TENANT_STATUSES } from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isOneOf } from '@shinefold/utils/primitives';

export function isTenantWritable({
  status,
  deprovisionedAt,
}: Pick<TTenant, 'status' | 'deprovisionedAt'>): boolean {
  return isOneOf(WRITABLE_TENANT_STATUSES, status) && !deprovisionedAt;
}
