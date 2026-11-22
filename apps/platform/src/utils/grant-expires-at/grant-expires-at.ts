import {
  ENTITLEMENT_GRANT_EXPIRY,
  ENTITLEMENT_GRANT_EXPIRY_DAYS,
  type TEntitlementGrantExpiry,
} from '@platform/constants/entitlement-grant';
import type { TMaybeNull } from '@shinefold/config';
import { DAY_MS } from '@shinefold/db/constants';

export const grantExpiresAt = (
  expiry: TEntitlementGrantExpiry,
  grantedAt: Date,
): TMaybeNull<Date> =>
  expiry === ENTITLEMENT_GRANT_EXPIRY.NEVER
    ? null
    : new Date(
        grantedAt.getTime() + ENTITLEMENT_GRANT_EXPIRY_DAYS[expiry] * DAY_MS,
      );
