import type { TMaybeUndefined } from '@blog/config/types';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { countMembershipsOverSeats } from '@blog/db/queries/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { isUndefined } from '@blog/utils/primitives';

export type TGraceLocks = {
  lockedMemberCount: number;
  customDomain: TMaybeUndefined<string>;
  subdomain: TMaybeUndefined<string>;
};

export function isUnderRootDomain(host: string, rootDomain: string): boolean {
  return host.endsWith(`.${rootDomain}`);
}

export async function findGraceLocks(
  { id, plan }: TTenant,
  hosts: string[],
  rootDomain: string,
): Promise<TGraceLocks> {
  const { seats, hasCustomDomain } = PLAN_ENTITLEMENTS[plan];
  const lockedMemberCount = await countMembershipsOverSeats(id, seats);

  return {
    lockedMemberCount,
    customDomain: hasCustomDomain
      ? undefined
      : hosts.find((host) => !isUnderRootDomain(host, rootDomain)),
    subdomain: hosts.find((host) => isUnderRootDomain(host, rootDomain)),
  };
}

export function hasGraceLocks({
  lockedMemberCount,
  customDomain,
}: TGraceLocks): boolean {
  return lockedMemberCount > 0 || !isUndefined(customDomain);
}
