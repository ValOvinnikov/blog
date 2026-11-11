import {
  HEADER_CONTROL_SHAPE,
  type THeaderControlShape,
} from '@blog/config/constants';

import { RADIUS_MD, RADIUS_PILL } from './radius-tokens';
import type { TThemeDeclarations } from './theme-declarations';

export const HEADER_CONTROL_SHAPE_DECLARATIONS: Record<
  THeaderControlShape,
  TThemeDeclarations
> = {
  [HEADER_CONTROL_SHAPE.ROUND]: { '--radius-header-control': RADIUS_PILL },
  [HEADER_CONTROL_SHAPE.ROUNDED]: { '--radius-header-control': RADIUS_MD },
  [HEADER_CONTROL_SHAPE.SQUARE]: { '--radius-header-control': '0' },
};
