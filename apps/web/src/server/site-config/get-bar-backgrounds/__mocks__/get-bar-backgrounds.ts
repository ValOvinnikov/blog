import type * as TModule from '@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds';
import { MOCK_BAR_BACKGROUNDS } from '@web/testing/shared/bar-backgrounds/fixtures';

export const getBarBackgrounds = vi.fn<typeof TModule.getBarBackgrounds>(
  async () => MOCK_BAR_BACKGROUNDS,
);
