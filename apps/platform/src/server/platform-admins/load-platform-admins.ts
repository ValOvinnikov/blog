import 'server-only';

import type { TMaybeNull } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TAdminRole } from '@shinefold/db/constants';

export type TPlatformAdminRow = {
  adminId: string;
  name: TMaybeNull<string>;
  email: TMaybeNull<string>;
  role: TAdminRole;
  grantedAt: Date;
  isYou: boolean;
};

export type TAdminInviteRow = {
  inviteId: string;
  email: string;
  role: TAdminRole;
  invitedAt: Date;
  isExpired: boolean;
};

export type TPlatformAdmins = {
  admins: TPlatformAdminRow[];
  invites: TAdminInviteRow[];
};

export const loadPlatformAdmins = async (
  viewerAdminId: string,
): Promise<TPlatformAdmins> => {
  const [admins, invites] = await Promise.all([
    queries.admins.listAdmins(),
    queries.adminInvites.listAdminInvites(),
  ]);
  const now = new Date();

  return {
    admins: admins.map(({ adminId, name, email, role, grantedAt }) => ({
      adminId,
      name,
      email,
      role,
      grantedAt,
      isYou: adminId === viewerAdminId,
    })),
    invites: invites.map(({ inviteId, email, role, invitedAt, expiresAt }) => ({
      inviteId,
      email,
      role,
      invitedAt,
      isExpired: expiresAt <= now,
    })),
  };
};
