import {
  FONT_CHOICE,
  PRESET_ID,
  type TFontChoice,
  type TPresetId,
} from '@blog/config';

export const PRESET_SWATCH = {
  [PRESET_ID.CONSOLE]: { glyph: '>_', font: FONT_CHOICE.JETBRAINS_MONO },
  [PRESET_ID.EDITORIAL]: { glyph: 'Aa', font: FONT_CHOICE.FRAUNCES },
} as const satisfies Record<TPresetId, { glyph: string; font: TFontChoice }>;
