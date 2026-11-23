import 'server-only';

import { currentDeprovisionRequestedAt } from '@platform/utils/deprovisioning-run-state/deprovisioning-run-state';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';

export const resolveCurrentDeprovisionRequestedAt = async ({
  id,
  provisioningSteps,
}: Pick<TTenant, 'id' | 'provisioningSteps'>): Promise<
  TMaybeUndefined<string>
> =>
  currentDeprovisionRequestedAt(
    await queries.auditEvents.getLatestDeprovisionRequestedAt(id),
    provisioningSteps?.run,
  );
