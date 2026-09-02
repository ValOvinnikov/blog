import {
  finishProvisioningRun,
  startProvisioningRun,
} from '@blog/db/queries/tenants';

export type TReportProvisioningRunStartInput = {
  tenantId: string;
  registry?: string;
  workflowRunUrl?: string;
};

/**
 * Records a provisioning run's start. Never throws: a write failure here
 * must not abort the run it's only trying to describe, so it's logged and
 * swallowed instead.
 */
export async function reportProvisioningRunStart(
  input: TReportProvisioningRunStartInput,
): Promise<void> {
  const result = await startProvisioningRun(input);

  if (!result.ok) {
    console.error(
      `report-provisioning-run: failed to record run start for tenant "${input.tenantId}" (${result.error}).`,
    );
  }
}

/**
 * Records a provisioning run's finish, on both a successful and a failed
 * run — the finish timestamp is post-mortem value either way. Never throws,
 * same posture as `reportProvisioningRunStart`.
 */
export async function reportProvisioningRunFinish(
  tenantId: string,
): Promise<void> {
  const result = await finishProvisioningRun({ tenantId });

  if (!result.ok) {
    console.error(
      `report-provisioning-run: failed to record run finish for tenant "${tenantId}" (${result.error}).`,
    );
  }
}
