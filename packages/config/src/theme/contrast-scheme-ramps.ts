import { COLOR_SCHEME, type TColorScheme } from '@blog/config/constants';

import { ACCENT_RAMP_DARK, ACCENT_RAMP_LIGHT } from './accent-ramps';
import {
  IMAGE_SCRIM_RAMP,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  type TOklchRamp,
} from './theme-declarations';
import {
  CODE_SYNTAX_RAMP_DARK,
  CODE_SYNTAX_RAMP_LIGHT,
  NEUTRAL_RAMP_DARK,
  NEUTRAL_RAMP_LIGHT,
  NEUTRAL_SCRIM_RAMP,
  STATUS_RAMP_DARK,
  STATUS_RAMP_LIGHT,
} from './theme-ramps';

export const SCHEME_RAMPS: Record<TColorScheme, TOklchRamp> = {
  [COLOR_SCHEME.LIGHT]: {
    ...NEUTRAL_RAMP_LIGHT,
    ...STATUS_RAMP_LIGHT,
    ...ACCENT_RAMP_LIGHT,
    ...LOGO_RAMP_LIGHT,
    ...IMAGE_SCRIM_RAMP,
    ...NEUTRAL_SCRIM_RAMP,
    ...CODE_SYNTAX_RAMP_LIGHT,
  },
  [COLOR_SCHEME.DARK]: {
    ...NEUTRAL_RAMP_DARK,
    ...STATUS_RAMP_DARK,
    ...ACCENT_RAMP_DARK,
    ...LOGO_RAMP_DARK,
    ...IMAGE_SCRIM_RAMP,
    ...NEUTRAL_SCRIM_RAMP,
    ...CODE_SYNTAX_RAMP_DARK,
  },
};
