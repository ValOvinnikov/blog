import { COLOR_SCHEME, HEADER_CONTROL_STYLE } from '@blog/config/constants';

import type { TContrastFailure } from './contrast-check';

export const KNOWN_CONTRAST_FAILURES: readonly TContrastFailure[] = [
  {
    pair: 'BORDER_STRONG',
    surface: '--primary',
    scheme: COLOR_SCHEME.LIGHT,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: '--primary-subtle',
    scheme: COLOR_SCHEME.LIGHT,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: '--surface',
    scheme: COLOR_SCHEME.LIGHT,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: '--primary',
    scheme: COLOR_SCHEME.DARK,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: '--primary-subtle',
    scheme: COLOR_SCHEME.DARK,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: '--surface',
    scheme: COLOR_SCHEME.DARK,
    hues: '0-359',
  },
  {
    pair: 'HEADER_CONTROL_BRAND',
    surface: '--header-control-fill',
    scheme: COLOR_SCHEME.LIGHT,
    headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
    hues: '181-197',
  },
];
