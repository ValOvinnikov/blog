import { RADIUS_SCALE, type TRadiusScale } from '@blog/config';

import { LookOptionGlyph } from './look-option-glyph';

const CORNER_PATH = {
  [RADIUS_SCALE.SM]: 'M4 17V6A2 2 0 0 1 6 4H17',
  [RADIUS_SCALE.MD]: 'M4 17V9A5 5 0 0 1 9 4H17',
  [RADIUS_SCALE.LG]: 'M4 17V13A9 9 0 0 1 13 4H17',
  [RADIUS_SCALE.XL]: 'M4 17A13 13 0 0 1 17 4',
} as const satisfies Record<TRadiusScale, string>;

export type TRadiusScaleGlyphProps = {
  scale: TRadiusScale;
};

export const RadiusScaleGlyph = ({ scale }: TRadiusScaleGlyphProps) => (
  <LookOptionGlyph>
    <path d={CORNER_PATH[scale]} />
  </LookOptionGlyph>
);
