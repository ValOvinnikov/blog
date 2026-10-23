import type { TPostRelatedModule } from '@blog/service';
import { mockPostModuleBase } from '@web/testing/modules/post-list/fixtures';

export const MOCK_POST_RELATED_HEADING = 'Related reading';

export const mockPostRelatedModuleData = (
  overrides: Partial<TPostRelatedModule> = {},
): TPostRelatedModule => ({
  ...mockPostModuleBase(MOCK_POST_RELATED_HEADING),
  ...overrides,
});
