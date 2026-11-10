import { DENSITY, type TDensity } from '@blog/config';

import { LookOptionGlyph } from './look-option-glyph';

const LINES_PATH = {
  [DENSITY.DEFAULT]: 'M3 4.5h14M3 10h14M3 15.5h14',
  [DENSITY.COMPACT]: 'M3 7h14M3 10h14M3 13h14',
} as const satisfies Record<TDensity, string>;

export type TDensityGlyphProps = {
  density: TDensity;
};

export const DensityGlyph = ({ density }: TDensityGlyphProps) => (
  <LookOptionGlyph>
    <path d={LINES_PATH[density]} />
  </LookOptionGlyph>
);
