import type { TValueOf } from '@blog/config/utils';

export const VIEW_TABS_VARIANT = {
  SEGMENTED: 'SEGMENTED',
  UNDERLINE: 'UNDERLINE',
} as const;

export type TViewTabsVariant = TValueOf<typeof VIEW_TABS_VARIANT>;
