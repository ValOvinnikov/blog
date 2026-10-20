import type * as ProvisioningSteps from '@worker/utils/db-provisioning-steps/db-provisioning-steps';

type TStepName = {
  [K in keyof typeof ProvisioningSteps]: (typeof ProvisioningSteps)[K] extends (
    ...args: never[]
  ) => unknown
    ? K
    : never;
}[keyof typeof ProvisioningSteps];

export function withFakeProvisioningSteps(
  actual: typeof ProvisioningSteps,
  stepNames: TStepName[],
): typeof ProvisioningSteps {
  const fakes = Object.fromEntries(stepNames.map((name) => [name, vi.fn()]));
  return { ...actual, ...fakes };
}
