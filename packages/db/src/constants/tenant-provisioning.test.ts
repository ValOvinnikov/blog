import {
  CORE_PROVISIONING_STEPS,
  TENANT_PROVISIONING_STEP,
} from './tenant-provisioning';

describe('CORE_PROVISIONING_STEPS', () => {
  it('lists the sequenced provisioning steps in order, excluding OWNER_ELEVATION', () => {
    expect(CORE_PROVISIONING_STEPS).toEqual([
      TENANT_PROVISIONING_STEP.SANITY_PROJECT,
      TENANT_PROVISIONING_STEP.SEED_CONTENT,
      TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
      TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
    ]);
  });

  it('never includes OWNER_ELEVATION, even if a future key is appended to TENANT_PROVISIONING_STEP', () => {
    expect(CORE_PROVISIONING_STEPS).not.toContain(
      TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
    );
  });
});
