import { ResolvedValue } from './resolved-value';

export type TColorSwatchProps = {
  /** Utility class rendering the token as a background, e.g. `bg-accent-solid`. */
  swatchClassName: string;
  /** Token name as used in utilities, e.g. `accent-solid`. */
  name: string;
  /** Underlying CSS custom property, e.g. `--color-accent-solid`. */
  cssVar: string;
};

/**
 * A single color-token row: a live swatch plus the utility name and its
 * resolved value. Swatches are driven entirely by token utility classes, so
 * they update automatically with the light/dark toolbar toggle.
 */
export const ColorSwatch = ({
  swatchClassName,
  name,
  cssVar,
}: TColorSwatchProps) => (
  <div className="flex items-center gap-4">
    <span
      className={`h-12 w-12 shrink-0 rounded-md border border-border ${swatchClassName}`}
      aria-hidden="true"
    />
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-sm text-text">{name}</span>
      <ResolvedValue cssVar={cssVar} />
    </div>
  </div>
);
