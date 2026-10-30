import { BRAND_VARIANT } from '@blog/config';
import type { TCookieSettingsModule } from '@blog/service';

export const mockCookieSettingsModule = (
  overrides: Partial<TCookieSettingsModule> = {},
): TCookieSettingsModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: undefined,
  layout: undefined,
  ...overrides,
});
