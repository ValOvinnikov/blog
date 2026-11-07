import type { TMaybeUndefined } from '@blog/config';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TMembership } from '@blog/db/schema/memberships';

import { isVirtualAdminMembership } from './build-virtual-admin-membership';

export type TOperatorViewContext = {
  admin?: TAdmin;
  membership?: TMaybeUndefined<TMembership>;
};

export const isOperatorView = ({
  admin,
  membership,
}: TOperatorViewContext): boolean =>
  Boolean(admin) ||
  (Boolean(membership) && isVirtualAdminMembership(membership!));
