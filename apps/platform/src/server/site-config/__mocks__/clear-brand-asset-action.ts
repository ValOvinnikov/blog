import { ACTION_OUTCOME } from '@blog/config';
import type { clearBrandAssetAction as TClearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';

export const clearBrandAssetAction = vi.fn<typeof TClearBrandAssetAction>(
  async () => ({ outcome: ACTION_OUTCOME.SUCCESS }),
);
