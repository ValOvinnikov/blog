import { platformTokens } from './platform-tokens';

const FOCUS_RING = 'focus-ring';

export const INSET_SHADOW_TOKENS = platformTokens(FOCUS_RING);

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
    'focus-glow',
    FOCUS_RING,
  ),
];
