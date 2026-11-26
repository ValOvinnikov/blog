import type { SIZE, TFontChoice } from '@shinefold/config';
import type { ReactNode } from 'react';

export type TPresetSwatch = {
  glyph: string;
  font: TFontChoice;
  glyphSize: typeof SIZE.SM | typeof SIZE.LG;
  ground: string;
  ink: string;
};

export type TPresetOption<TId extends string> = {
  id: TId;
  name: string;
  description: string;
  swatch: TPresetSwatch;
  badge?: ReactNode;
};
