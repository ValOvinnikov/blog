import { type TUpgradeState, UPGRADE_STATE } from '@platform/constants/billing';

export const getUpgradeStateAction = vi.fn(
  async (): Promise<TUpgradeState> => UPGRADE_STATE.AVAILABLE,
);
