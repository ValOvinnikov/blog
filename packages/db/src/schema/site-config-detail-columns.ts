import {
  COLOR_MODE,
  DIVIDER_WIDTH,
  HEADING_CASE,
  HEADING_WEIGHT,
  IMAGE_PROPORTION,
} from '@shinefold/config/constants';

import {
  colorModeEnum,
  dividerWidthEnum,
  headingCaseEnum,
  headingWeightEnum,
  imageProportionEnum,
} from './site-config-enums';

export const siteConfigDetailColumns = {
  headingWeight: headingWeightEnum('heading_weight')
    .notNull()
    .default(HEADING_WEIGHT.MEDIUM),
  headingCase: headingCaseEnum('heading_case')
    .notNull()
    .default(HEADING_CASE.AS_WRITTEN),
  imageProportion: imageProportionEnum('image_proportion')
    .notNull()
    .default(IMAGE_PROPORTION.AS_DESIGNED),
  dividerWidth: dividerWidthEnum('divider_width')
    .notNull()
    .default(DIVIDER_WIDTH.HAIRLINE),
  colorMode: colorModeEnum('color_mode').notNull().default(COLOR_MODE.READER),
};
