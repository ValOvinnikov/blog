import { BRAND_VARIANT } from '@shinefold/config';
import type { TCookieSettingsModule } from '@shinefold/service';

export const mockCookieSettingsModule = (
  overrides: Partial<TCookieSettingsModule> = {},
): TCookieSettingsModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: undefined,
  layout: undefined,
  ...overrides,
});
