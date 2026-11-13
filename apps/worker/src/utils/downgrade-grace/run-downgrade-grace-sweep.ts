import type { TValueOf } from '@blog/config/utils';
import { GRACE_EMAIL, type TGraceEmail } from '@blog/db/constants';
import { listTenantHosts } from '@blog/db/queries/tenant-domains/list-tenant-hosts';
import {
  listTenantsDueForGraceEmail,
  listTenantsDueForGraceEnd,
  listTenantsWithEndedTrial,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { isPlatformTenant } from '@blog/db/utils/is-platform-tenant/is-platform-tenant';
import { sanitizeLogMessage } from '@blog/insight';
import {
  DOWNGRADE_GRACE_LOG,
  DOWNGRADE_GRACE_STEP,
} from '@worker/constants/downgrade-grace';
import type { TInactivitySweepContext } from '@worker/utils/inactivity-sweep/inactivity-stages';
import { logger } from '@worker/utils/logger/logger';

import { endGrace } from './grace-end';
import { endTrial, sendGraceEmail, type TGraceStepInput } from './grace-steps';

export type TDowngradeGraceSweepResult = Record<
  TValueOf<typeof DOWNGRADE_GRACE_STEP>,
  number
>;

type TGraceStep = {
  step: TValueOf<typeof DOWNGRADE_GRACE_STEP>;
  listDue: (now: Date) => Promise<TTenant[]>;
  run: (input: TGraceStepInput) => Promise<boolean>;
};

function emailStep(email: TGraceEmail): TGraceStep {
  return {
    step: email,
    listDue: (now) => listTenantsDueForGraceEmail(email, now),
    run: (input) => sendGraceEmail(email, input),
  };
}

// Trials end before the emails, so a trial ended today gets its day-0 email in the same sweep; later emails go first, so one sweep never sends two.
const GRACE_STEPS: TGraceStep[] = [
  {
    step: DOWNGRADE_GRACE_STEP.TRIAL_END,
    listDue: listTenantsWithEndedTrial,
    run: endTrial,
  },
  {
    step: DOWNGRADE_GRACE_STEP.GRACE_END,
    listDue: listTenantsDueForGraceEnd,
    run: endGrace,
  },
  emailStep(GRACE_EMAIL.ENDING),
  emailStep(GRACE_EMAIL.HALFWAY),
  emailStep(GRACE_EMAIL.STARTED),
];

async function runForTenant(
  { step, run }: TGraceStep,
  tenant: TTenant,
  ctx: TInactivitySweepContext,
): Promise<boolean> {
  try {
    const hosts = await listTenantHosts(tenant);
    if (isPlatformTenant(hosts, ctx.env.tenantRootDomain)) return false;
    return await run({ tenant, hosts, ctx });
  } catch (error) {
    logger.error(DOWNGRADE_GRACE_LOG.STEP_FAILED, {
      tenantId: tenant.id,
      step,
      error: sanitizeLogMessage(error),
    });
    return false;
  }
}

export async function runDowngradeGraceSweep(
  ctx: TInactivitySweepContext,
): Promise<TDowngradeGraceSweepResult> {
  const result: Partial<TDowngradeGraceSweepResult> = {};
  for (const graceStep of GRACE_STEPS) {
    let count = 0;
    for (const tenant of await graceStep.listDue(ctx.now)) {
      if (await runForTenant(graceStep, tenant, ctx)) count += 1;
    }
    result[graceStep.step] = count;
  }
  return result as TDowngradeGraceSweepResult;
}
