import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';

export const isTenantOwner = ({ role }: TMembership): boolean =>
  role === MEMBERSHIP_ROLE.OWNER;
