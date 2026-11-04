import { FONT_CHOICE, PRESET_ID, SIZE, type TPresetId } from '@blog/config';

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
} as const satisfies Record<TPresetId, TPresetSwatch>;
