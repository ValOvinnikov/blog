import { BRAND_VARIANT, GRID_COLUMNS } from '@shinefold/config';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import {
  MOCK_SECTION_LOOK,
  MOCK_SECTION_STYLE_OVERRIDES,
} from '@web/testing/shared/section-appearance/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { getModuleSection } from './get-module-section';

vi.mock(
  '@web/server/site-config/get-section-appearance/get-section-appearance',
);

const MOCK_MODULE_DATA = {
  brandVariant: BRAND_VARIANT.SECONDARY,
  layout: undefined,
  ...MOCK_SECTION_STYLE_OVERRIDES,
  columns: GRID_COLUMNS.THREE,
};

describe(getModuleSection, () => {
  it('scopes the appearance to the tenant and the style overrides', async () => {
    await getModuleSection(MOCK_TENANT_ID, MOCK_MODULE_DATA);

    expect(vi.mocked(getSectionAppearance)).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_SECTION_STYLE_OVERRIDES,
    );
  });

  it('returns the section prop and the rest of the module data', async () => {
    const result = await getModuleSection(MOCK_TENANT_ID, MOCK_MODULE_DATA);

    expect(result).toEqual({
      section: {
        brandVariant: BRAND_VARIANT.SECONDARY,
        layout: undefined,
        appearance: {
          overrides: MOCK_SECTION_STYLE_OVERRIDES,
          look: MOCK_SECTION_LOOK,
        },
      },
      content: { columns: GRID_COLUMNS.THREE },
    });
  });
});
