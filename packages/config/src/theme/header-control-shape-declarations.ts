import {
  HEADER_CONTROL_SHAPE,
  RADIUS_SCALE,
  type THeaderControlShape,
} from '@blog/config/constants';

import { RADIUS_DECLARATIONS } from './radius-declarations';
import { RADIUS_MD, RADIUS_PILL } from './radius-tokens';
import type { TThemeDeclarations } from './theme-declarations';

export const HEADER_CONTROL_SHAPE_DECLARATIONS: Record<
  THeaderControlShape,
  TThemeDeclarations
> = {
  [HEADER_CONTROL_SHAPE.ROUND]: { '--radius-header-control': RADIUS_PILL },
  // Floored at Small, so None squares cards without turning Rounded into Square.
  [HEADER_CONTROL_SHAPE.ROUNDED]: {
    '--radius-header-control': `max(${RADIUS_MD}, ${RADIUS_DECLARATIONS[RADIUS_SCALE.SM]['--radius-md']})`,
  },
  [HEADER_CONTROL_SHAPE.SQUARE]: { '--radius-header-control': '0' },
};
