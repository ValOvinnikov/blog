import {
  COLOR_SCHEME,
  HEADER_CONTROL_STYLE,
} from '@shinefold/config/constants';

import type { TContrastFailure } from './contrast-check';
import { PRIMARY, PRIMARY_SUBTLE, SURFACE } from './contrast-surfaces';

const FAILURE_CASE_KEYS = [
  'pair',
  'surface',
  'scheme',
  'cardStyle',
  'headerControlStyle',
  'navLinkStyle',
] as const satisfies readonly (keyof TContrastFailure)[];

export const KNOWN_CONTRAST_FAILURES: readonly TContrastFailure[] = [
  {
    pair: 'BORDER_STRONG',
    surface: PRIMARY,
    scheme: COLOR_SCHEME.LIGHT,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: PRIMARY_SUBTLE,
    scheme: COLOR_SCHEME.LIGHT,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: SURFACE,
    scheme: COLOR_SCHEME.LIGHT,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: PRIMARY,
    scheme: COLOR_SCHEME.DARK,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: PRIMARY_SUBTLE,
    scheme: COLOR_SCHEME.DARK,
    hues: '0-359',
  },
  {
    pair: 'BORDER_STRONG',
    surface: SURFACE,
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

export const isKnownFailure = (failure: TContrastFailure): boolean =>
  KNOWN_CONTRAST_FAILURES.some((known) =>
    FAILURE_CASE_KEYS.every((key) => known[key] === failure[key]),
  );
