import { DISPLAY_MODE } from '@blog/config';
import type { TPostFeaturedModule } from '@blog/service';
import { mockPostModuleBase } from '@web/testing/modules/post-list/fixtures';

export const MOCK_POST_FEATURED_HEADING = 'Editor picks';

export const mockPostFeaturedModuleData = (
  overrides: Partial<TPostFeaturedModule> = {},
): TPostFeaturedModule => ({
  ...mockPostModuleBase(MOCK_POST_FEATURED_HEADING),
  displayMode: DISPLAY_MODE.GRID,
  ...overrides,
});
