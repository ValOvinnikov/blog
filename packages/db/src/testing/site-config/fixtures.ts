import {
  DENSITY,
  FONT_CHOICE,
  HUE_MAX,
  HUE_MIN,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import type { TUpdateSiteConfigInput } from '@blog/db/queries/site-config/upsert-site-config';
import { createMockFaker } from '@blog/db/testing/mock-faker';

const siteConfigFaker = createMockFaker(60222);

const HUE_HEADROOM_BELOW = 2;
const HUE_HEADROOM_ABOVE = 1;

export const MOCK_ACCENT_HUE = siteConfigFaker.number.int({
  min: HUE_MIN + HUE_HEADROOM_BELOW,
  max: HUE_MAX - HUE_HEADROOM_ABOVE,
});
export const MOCK_NOT_FOUND_HEADING = siteConfigFaker.lorem.words(3);

export const MOCK_SITE_CONFIG_FIELDS = {
  preset: PRESET_ID.CONSOLE,
  accentHue: MOCK_ACCENT_HUE,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
} satisfies TUpdateSiteConfigInput;
