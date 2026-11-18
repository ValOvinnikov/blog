import { MEMBER_ACCESS_HOOK_TOKEN_PREFIX } from '@worker/constants/member-access';

export function memberAccessHookToken(
  tenantId: string,
  membershipId: string,
): string {
  return `${MEMBER_ACCESS_HOOK_TOKEN_PREFIX}${tenantId}:${membershipId}`;
}
