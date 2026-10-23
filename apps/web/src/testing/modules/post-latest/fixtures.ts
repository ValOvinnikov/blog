import { DISPLAY_MODE } from '@blog/config';
import type { TPostLatestModule } from '@blog/service';
import { mockPostModuleBase } from '@web/testing/modules/post-list/fixtures';

export const mockPostLatestModuleData = (
  overrides: Partial<TPostLatestModule> = {},
): TPostLatestModule => ({
  ...mockPostModuleBase(),
  displayMode: DISPLAY_MODE.GRID,
  ...overrides,
});
