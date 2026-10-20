import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';

import { reportOwnerElevationOutcome } from './report-owner-elevation-outcome';

const { updateProvisioningStepMock } = vi.hoisted(() => ({
  updateProvisioningStepMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  updateProvisioningStep: updateProvisioningStepMock,
}));

beforeEach(() => {
  updateProvisioningStepMock.mockResolvedValue({ ok: true, data: undefined });
});

describe(reportOwnerElevationOutcome, () => {
  it.each(Object.values(ELEVATE_TENANT_OWNER_OUTCOME))(
    'reports DONE with detail %s for the OWNER_ELEVATION step',
    async (outcome: TElevateTenantOwnerOutcome) => {
      await reportOwnerElevationOutcome('tenant-1', outcome);

      expect(updateProvisioningStepMock).toHaveBeenCalledTimes(1);
      expect(updateProvisioningStepMock).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: outcome,
      });
    },
  );

  it('never reports RUNNING or FAILED, regardless of outcome', async () => {
    for (const outcome of Object.values(ELEVATE_TENANT_OWNER_OUTCOME)) {
      await reportOwnerElevationOutcome('tenant-1', outcome);
    }

    const statuses = updateProvisioningStepMock.mock.calls.map(
      (call) => (call[0] as { status: string }).status,
    );
    expect(statuses).toEqual(
      Object.values(ELEVATE_TENANT_OWNER_OUTCOME).map(
        () => TENANT_PROVISIONING_STEP_STATUS.DONE,
      ),
    );
  });

  it('records detail and notifiedOwnerElevationOutcome in the same write when a notification fired', async () => {
    await reportOwnerElevationOutcome('tenant-1', 'STALLED', 'STALLED');

    expect(updateProvisioningStepMock).toHaveBeenCalledTimes(1);
    expect(updateProvisioningStepMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      detail: 'STALLED',
      notifiedOwnerElevationOutcome: 'STALLED',
    });
  });

  it('omits notifiedOwnerElevationOutcome entirely when nothing was notified', async () => {
    await reportOwnerElevationOutcome('tenant-1', 'STALLED');

    expect(updateProvisioningStepMock).toHaveBeenCalledTimes(1);
    expect(updateProvisioningStepMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      detail: 'STALLED',
    });
  });
});
