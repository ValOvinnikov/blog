import 'server-only';

import type { TNullable } from '@shinefold/config/types';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import type { TAdmin } from '@shinefold/db/schema/admins';
import type { TMembership } from '@shinefold/db/schema/memberships';
import { isUndefined } from '@shinefold/utils/primitives';

import { isVirtualAdminMembership } from './build-virtual-admin-membership';
import { isSuperAdmin } from './is-super-admin';

export type TPlatformViewer = {
  isOwner: boolean;
  canManage: boolean;
  isOperator: boolean;
  isSuperAdmin: boolean;
};

export type TViewerRecords = {
  membership?: TMembership;
  admin?: TNullable<TAdmin>;
};

/** `isOwner` is the site's real owner only; an operator's virtual OWNER membership counts as `canManage`, never `isOwner`. */
export const toPlatformViewer = ({
  membership,
  admin,
}: TViewerRecords): TPlatformViewer => {
  const isOperator = isUndefined(membership)
    ? Boolean(admin)
    : isVirtualAdminMembership(membership);
  const isOwner = !isOperator && membership?.role === MEMBERSHIP_ROLE.OWNER;

  return {
    isOwner,
    canManage: isOwner || isOperator,
    isOperator,
    isSuperAdmin: isSuperAdmin(admin),
  };
};
