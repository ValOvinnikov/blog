import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import type {
  TSanityLoginProvider,
  TSanityProjectRole,
} from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';

export type TTenantOwnerAccess = {
  sanityInviteId: TMaybeUndefined<string>;
  inviteSentAt: TMaybeUndefined<Date>;
  inviteAcceptedAt: TMaybeUndefined<Date>;
  sanityUserId: TMaybeUndefined<string>;
  loginProvider: TMaybeUndefined<TSanityLoginProvider>;
  sanityRole: TMaybeUndefined<TSanityProjectRole>;
};

export const tenantOwnerAccessColumns = {
  sanityInviteId: tenants.ownerSanityInviteId,
  inviteSentAt: tenants.ownerInviteSentAt,
  inviteAcceptedAt: tenants.ownerInviteAcceptedAt,
  sanityUserId: tenants.ownerSanityUserId,
  loginProvider: tenants.ownerLoginProvider,
  sanityRole: tenants.ownerSanityRole,
};

type TTenantOwnerAccessRow = {
  [K in keyof TTenantOwnerAccess]: TMaybeNull<
    Exclude<TTenantOwnerAccess[K], undefined>
  >;
};

export function toTenantOwnerAccess(
  row: TTenantOwnerAccessRow,
): TTenantOwnerAccess {
  return {
    sanityInviteId: row.sanityInviteId ?? undefined,
    inviteSentAt: row.inviteSentAt ?? undefined,
    inviteAcceptedAt: row.inviteAcceptedAt ?? undefined,
    sanityUserId: row.sanityUserId ?? undefined,
    loginProvider: row.loginProvider ?? undefined,
    sanityRole: row.sanityRole ?? undefined,
  };
}
