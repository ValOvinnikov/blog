import { platformTokens } from './platform-tokens';

export const SHADOW_TOKENS = [
  'platform',
  ...platformTokens(
    'lg',
    'frame',
    'sheet',
    'index',
    'unsaved',
    'bar',
    'dock',
    'xs',
    'glyph',
  ),
];
