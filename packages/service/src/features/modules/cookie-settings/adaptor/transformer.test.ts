import { BRAND_VARIANT } from '@shinefold/config';
import {
  MOCK_COOKIE_SETTINGS_HEADING,
  mockRawCookieSettingsModule,
} from '@shinefold/service/testing/modules/fixtures';
import { mockRawWideLayout } from '@shinefold/service/testing/shared/fixtures';
import { mockModuleHeadingBlockView } from '@shinefold/service/testing/shared/localized';

import { toCookieSettingsModule } from './transformer';

const MOCK_LAYOUT = mockRawWideLayout();

describe(toCookieSettingsModule, () => {
  it('maps a fully authored cookie settings module', () => {
    const module = toCookieSettingsModule(
      mockRawCookieSettingsModule({
        brandVariant: BRAND_VARIANT.SECONDARY,
        layout: MOCK_LAYOUT,
      }),
    );

    expect(module).toEqual({
      brandVariant: BRAND_VARIANT.SECONDARY,
      headingBlock: mockModuleHeadingBlockView(MOCK_COOKIE_SETTINGS_HEADING),
      layout: MOCK_LAYOUT,
    });
  });

  it('leaves heading block and layout undefined when unset', () => {
    const module = toCookieSettingsModule(
      mockRawCookieSettingsModule({ headingBlock: null }),
    );

    expect(module.headingBlock).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });
});
