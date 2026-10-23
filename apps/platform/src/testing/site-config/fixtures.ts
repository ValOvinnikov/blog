import { DENSITY, FONT_CHOICE, PRESET_ID, RADIUS_SCALE } from '@blog/config';

export const MOCK_LOGO_URL =
  'https://example.blob.vercel-storage.com/brand-logo.png';
export const MOCK_FAVICON_URL =
  'https://example.blob.vercel-storage.com/favicon.png';
export const CURRENT_LOGO = 'Current logo';
export const UPLOAD_LOGO = 'Upload logo';
export const REPLACE_LOGO = 'Replace logo';
export const MOCK_STAGED_LOGO_BLOB_URL = 'blob:staged-logo';

export const MOCK_THEME_FIELDS = {
  preset: PRESET_ID.CONSOLE,
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};
