import 'server-only';

import { UPGRADE_STATE } from '@platform/constants/billing';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { upgradeStateFor } from '@platform/server/billing/upgrade-state-for';
import { isOneOf } from '@shinefold/utils/primitives';

const PLAN_CHANGE_PAGE_STATES = [
  UPGRADE_STATE.AVAILABLE,
  UPGRADE_STATE.SUBSCRIBED,
];

// upgradeStateFor answers SUBSCRIBED before its owner gate, so the owner check is ours.
export const canOfferUpgrade = (
  tenant: Parameters<typeof upgradeStateFor>[0],
  viewer: TPlatformViewer,
): boolean =>
  viewer.isOwner &&
  isOneOf(PLAN_CHANGE_PAGE_STATES, upgradeStateFor(tenant, viewer));
