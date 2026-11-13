import type { TMaybeUndefined } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { type TTrial, trialFor } from '@platform/utils/trial-for/trial-for';

export type TPlatformTenant = TTenant & {
  trial: TMaybeUndefined<TTrial>;
};

export const toPlatformTenant = (
  tenant: TTenant,
  now: Date = new Date(),
): TPlatformTenant => ({ ...tenant, trial: trialFor(tenant, now) });
