import { HEADER_CONTROL_STYLE, type THeaderControlStyle } from '@blog/config';

import { LookOptionGlyph } from './look-option-glyph';

export type THeaderControlStyleGlyphProps = {
  style: THeaderControlStyle;
};

export const HeaderControlStyleGlyph = ({
  style,
}: THeaderControlStyleGlyphProps) => (
  <LookOptionGlyph>
    {style === HEADER_CONTROL_STYLE.OUTLINED && (
      <circle cx={10} cy={10} r={8.25} strokeWidth={1.5} />
    )}
    {style === HEADER_CONTROL_STYLE.SOFT && (
      <circle
        cx={10}
        cy={10}
        r={9}
        stroke="none"
        fill="currentColor"
        fillOpacity={0.2}
      />
    )}
    <circle cx={10} cy={10} r={3} strokeWidth={1.6} />
  </LookOptionGlyph>
);
