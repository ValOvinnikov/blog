import type * as TModule from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { MOCK_SECTION_LOOK } from '@web/testing/shared/section-appearance/fixtures';

export const getSectionAppearance = vi.fn<typeof TModule.getSectionAppearance>(
  async (_tenantId, overrides) => ({ overrides, look: MOCK_SECTION_LOOK }),
);
