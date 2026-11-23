import 'server-only';

import {
  currentDeprovisionRequestedAt,
  isDeprovisionUnderway,
} from '@platform/utils/deprovisioning-run-state/deprovisioning-run-state';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { queries } from '@shinefold/db';

export const resolveIsDeprovisionUnderway = async ({
  id,
  provisioningSteps,
  deprovisioningSteps,
}: Pick<
  TPlatformTenant,
  'id' | 'provisioningSteps' | 'deprovisioningSteps'
>): Promise<boolean> => {
  const deprovisionRequestedAt =
    await queries.auditEvents.getLatestDeprovisionRequestedAt(id);

  return isDeprovisionUnderway(
    currentDeprovisionRequestedAt(
      deprovisionRequestedAt,
      provisioningSteps?.run,
    ),
    deprovisioningSteps?.run,
  );
};
