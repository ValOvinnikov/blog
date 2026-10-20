import { OWNER_ACCESS_HOOK_TOKEN_PREFIX } from '@worker/constants/owner-access';

export function ownerAccessHookToken(tenantId: string): string {
  return `${OWNER_ACCESS_HOOK_TOKEN_PREFIX}${tenantId}`;
}
