import { ResolvedValue } from './resolved-value';

export type TFontFamilySpecimenProps = {
  /** Utility class applying the font-family token, e.g. `font-display`. */
  fontClassName: string;
  /** Token name as used in utilities, e.g. `display`. */
  name: string;
  /** Underlying CSS custom property, e.g. `--font-display`. */
  cssVar: string;
  sample: string;
};

/**
 * A single font-family-token row: live sample text set in the token's
 * typeface, the utility name, and its resolved font stack.
 */
export const FontFamilySpecimen = ({
  fontClassName,
  name,
  cssVar,
  sample,
}: TFontFamilySpecimenProps) => (
  <div className="flex flex-col gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0">
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-sm text-text">font-{name}</span>
      <ResolvedValue cssVar={cssVar} />
    </div>
    <p className={`text-xl text-text ${fontClassName}`}>{sample}</p>
  </div>
);
