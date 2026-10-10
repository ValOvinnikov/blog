import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import type { CSSProperties } from 'react';

export const SITE_PREVIEW_THEME: TSitePreviewTheme = {
  tokenStyle: { '--brand-primary': 'oklch(0.53 0.17 28)' } as CSSProperties,
  isDark: false,
  headingFontFamily: 'mock-heading-font',
  bodyFontFamily: 'mock-body-font',
};
