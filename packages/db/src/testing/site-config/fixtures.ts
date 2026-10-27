import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import type { TUpdateSiteConfigInput } from '@blog/db/queries/site-config/upsert-site-config';
import { faker } from '@faker-js/faker';

faker.seed(6022);

export const MOCK_ACCENT_HUE = 250;
export const MOCK_NOT_FOUND_HEADING = faker.lorem.words(3);

export const MOCK_SITE_CONFIG_FIELDS = {
  preset: PRESET_ID.CONSOLE,
  accentHue: MOCK_ACCENT_HUE,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
} satisfies TUpdateSiteConfigInput;
