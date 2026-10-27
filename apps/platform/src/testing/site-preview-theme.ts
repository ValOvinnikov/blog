import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import type { CSSProperties } from 'react';

export const MOCK_BRAND_PRIMARY = 'oklch(0.53 0.17 28)';

export const MOCK_SITE_PREVIEW_THEME: TSitePreviewTheme = {
  tokenStyle: { '--brand-primary': MOCK_BRAND_PRIMARY } as CSSProperties,
  isDark: false,
  headingFontFamily: 'mock-heading-font',
  bodyFontFamily: 'mock-body-font',
};
