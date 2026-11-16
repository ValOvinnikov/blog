import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TPlanEntitlements } from '@shinefold/db/constants';
import { countMembershipsOverSeats } from '@shinefold/db/queries/memberships';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isUndefined } from '@shinefold/utils/primitives';

export type TGraceLocks = {
  lockedMemberCount: number;
  customDomain: TMaybeUndefined<string>;
  subdomain: TMaybeUndefined<string>;
};

function isUnderRootDomain(host: string, rootDomain: string): boolean {
  return host.endsWith(`.${rootDomain}`);
}

export function findSubdomain(
  hosts: string[],
  rootDomain: string,
): TMaybeUndefined<string> {
  return hosts.find((host) => isUnderRootDomain(host, rootDomain));
}

export async function findGraceLocks(
  { id, primaryDomain }: Pick<TTenant, 'id' | 'primaryDomain'>,
  {
    seats,
    hasCustomDomain,
  }: Pick<TPlanEntitlements, 'seats' | 'hasCustomDomain'>,
  hosts: string[],
  rootDomain: string,
): Promise<TGraceLocks> {
  const isCustomDomainMain =
    !hasCustomDomain && !isUnderRootDomain(primaryDomain, rootDomain);

  return {
    lockedMemberCount: await countMembershipsOverSeats(id, seats),
    customDomain: isCustomDomainMain ? primaryDomain : undefined,
    subdomain: findSubdomain(hosts, rootDomain),
  };
}

export function hasGraceLocks({
  lockedMemberCount,
  customDomain,
}: TGraceLocks): boolean {
  return lockedMemberCount > 0 || !isUndefined(customDomain);
}
