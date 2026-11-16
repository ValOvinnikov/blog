import { DIVIDER_WIDTH, type TDividerWidth } from '@shinefold/config/constants';

import type { TThemeDeclarations } from './theme-declarations';

export const DIVIDER_WIDTH_DECLARATIONS: Record<
  TDividerWidth,
  TThemeDeclarations
> = {
  [DIVIDER_WIDTH.HAIRLINE]: { '--divider-width': '1px' },
  [DIVIDER_WIDTH.BOLD]: { '--divider-width': '2px' },
};
