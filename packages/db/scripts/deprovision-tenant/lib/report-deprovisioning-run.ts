import {
  finishDeprovisioningRun,
  startDeprovisioningRun,
} from '@blog/db/queries/tenants';

export type TReportDeprovisioningRunStartInput = {
  tenantId: string;
  workflowRunUrl?: string;
};

/**
 * Records a deprovisioning run's start. Never throws: a write failure here
 * must not abort the run it's only trying to describe, so it's logged and
 * swallowed instead.
 */
export async function reportDeprovisioningRunStart(
  input: TReportDeprovisioningRunStartInput,
): Promise<void> {
  const result = await startDeprovisioningRun(input);

  if (!result.ok) {
    console.error(
      `report-deprovisioning-run: failed to record run start for tenant "${input.tenantId}" (${result.error}).`,
    );
  }
}

/**
 * Records a deprovisioning run's finish, on both a successful and a failed
 * run — the finish timestamp is post-mortem value either way. Never throws,
 * same posture as `reportDeprovisioningRunStart`.
 */
export async function reportDeprovisioningRunFinish(
  tenantId: string,
): Promise<void> {
  const result = await finishDeprovisioningRun({ tenantId });

  if (!result.ok) {
    console.error(
      `report-deprovisioning-run: failed to record run finish for tenant "${tenantId}" (${result.error}).`,
    );
  }
}
