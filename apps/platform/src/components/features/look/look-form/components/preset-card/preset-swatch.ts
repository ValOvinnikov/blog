import {
  FONT_CHOICE,
  PRESET_ID,
  SIZE,
  type TPresetId,
} from '@shinefold/config';

import type { TPresetSwatch } from './components/preset-strip';

export const PRESET_SWATCH = {
  [PRESET_ID.CONSOLE]: {
    glyph: '>_',
    font: FONT_CHOICE.JETBRAINS_MONO,
    glyphSize: SIZE.SM,
    ground: '#eef1f5',
    ink: '#12141a',
  },
  [PRESET_ID.EDITORIAL]: {
    glyph: 'Aa',
    font: FONT_CHOICE.FRAUNCES,
    glyphSize: SIZE.LG,
    ground: '#f6efe4',
    ink: '#3b2a14',
  },
  [PRESET_ID.SHINEFOLD]: {
    glyph: 'S',
    font: FONT_CHOICE.SPACE_GROTESK,
    glyphSize: SIZE.LG,
    ground: '#ffc233',
    ink: '#0e1726',
  },
} as const satisfies Record<TPresetId, TPresetSwatch>;
