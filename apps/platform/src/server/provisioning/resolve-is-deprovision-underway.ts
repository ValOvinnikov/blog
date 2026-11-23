import 'server-only';

import { isDeprovisionUnderway } from '@platform/utils/deprovisioning-run-state/deprovisioning-run-state';
import type { TTenant } from '@shinefold/db/schema/tenants';

import { resolveCurrentDeprovisionRequestedAt } from './resolve-current-deprovision-requested-at';

export type TDeprovisionStateTenant = Pick<
  TTenant,
  'id' | 'provisioningSteps' | 'deprovisioningSteps'
>;

export const resolveIsDeprovisionUnderway = async (
  tenant: TDeprovisionStateTenant,
): Promise<boolean> =>
  isDeprovisionUnderway(
    await resolveCurrentDeprovisionRequestedAt(tenant),
    tenant.deprovisioningSteps?.run,
  );
