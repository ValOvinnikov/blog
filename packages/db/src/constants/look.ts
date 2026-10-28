import type { TSiteConfig } from '@blog/db/schema/site-config';

export const LOOK_FIELDS = [
  'preset',
  'accentHue',
  'logoHue',
  'headingFont',
  'bodyFont',
  'radiusScale',
  'density',
  'languageSwitcherStyle',
  'cardStyle',
  'headerControlStyle',
  'accountButtonStyle',
  'accountPanelStyle',
  'accountPhonePlacement',
  'busyButtonStyle',
  'spinnerStyle',
  'headerLayout',
  'headerSubmenuStyle',
  'headerBarStyle',
  'logoAssetUrl',
  'faviconAssetUrl',
] as const satisfies readonly (keyof TSiteConfig)[];

export type TLookField = (typeof LOOK_FIELDS)[number];
