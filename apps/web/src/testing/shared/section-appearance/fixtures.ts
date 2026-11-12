import {
  BRAND_VARIANT,
  BUTTON_SHAPE,
  CARD_STYLE,
  DENSITY,
  RADIUS_SCALE,
} from '@blog/config';
import type { ISectionProps } from '@web/components/shared/section';
import type { TSectionAppearance } from '@web/utils/build-section-scope-declarations';
import type { TSectionStyleOverrides } from '@web/utils/gate-section-style-overrides';

export const MOCK_SECTION_LOOK: TSectionAppearance['look'] = {
  cardStyle: CARD_STYLE.PLAIN,
  buttonShape: BUTTON_SHAPE.ROUNDED,
};

export const MOCK_SECTION_STYLE_OVERRIDES: TSectionStyleOverrides = {
  cardStyle: CARD_STYLE.OUTLINED,
  radiusScale: RADIUS_SCALE.XL,
  density: DENSITY.COMPACT,
};

export const MOCK_OUTLINED_BRAND_TINT_SECTION: Pick<
  ISectionProps,
  'brandVariant' | 'appearance'
> = {
  brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
  appearance: {
    overrides: MOCK_SECTION_STYLE_OVERRIDES,
    look: {
      cardStyle: CARD_STYLE.ACCENT_BAR,
      buttonShape: BUTTON_SHAPE.ROUNDED,
    },
  },
};

export const MOCK_NO_SECTION_STYLE_OVERRIDES: TSectionStyleOverrides = {
  cardStyle: undefined,
  radiusScale: undefined,
  density: undefined,
};

export const MOCK_STALE_OPTION = 'RETIRED';

export const MOCK_SCOPED_RADIUS_TOKEN = '--radius-md';
