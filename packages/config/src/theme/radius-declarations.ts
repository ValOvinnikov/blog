import { RADIUS_SCALE, type TRadiusScale } from '@blog/config/constants';

import type { TThemeDeclarations } from './theme-declarations';

export const RADIUS_DECLARATIONS: Record<TRadiusScale, TThemeDeclarations> = {
  [RADIUS_SCALE.NONE]: {
    '--radius-sm': '0',
    '--radius': '0',
    '--radius-md': '0',
    '--radius-lg': '0',
    '--radius-xl': '0',
  },
  [RADIUS_SCALE.SM]: {
    '--radius-sm': '2px',
    '--radius': '4px',
    '--radius-md': '4px',
    '--radius-lg': '6px',
    '--radius-xl': '8px',
  },
  [RADIUS_SCALE.MD]: {
    '--radius-sm': '4px',
    '--radius': '8px',
    '--radius-md': '8px',
    '--radius-lg': '12px',
    '--radius-xl': '16px',
  },
  [RADIUS_SCALE.LG]: {
    '--radius-sm': '6px',
    '--radius': '12px',
    '--radius-md': '12px',
    '--radius-lg': '18px',
    '--radius-xl': '24px',
  },
  [RADIUS_SCALE.XL]: {
    '--radius-sm': '8px',
    '--radius': '16px',
    '--radius-md': '16px',
    '--radius-lg': '24px',
    '--radius-xl': '32px',
  },
};
