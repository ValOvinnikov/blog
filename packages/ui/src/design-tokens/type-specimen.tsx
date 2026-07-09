import { ResolvedValue } from './resolved-value';

export type TTypeSpecimenProps = {
  /** Utility class applying the size token, e.g. `text-hero`. */
  sizeClassName: string;
  /** Token name as used in utilities, e.g. `hero`. */
  name: string;
  /** Underlying CSS custom property, e.g. `--text-hero`. */
  cssVar: string;
  sample: string;
};

/**
 * A single typography-token row: live sample text set at the token's size,
 * the utility name, and its resolved `font-size` value.
 */
export const TypeSpecimen = ({
  sizeClassName,
  name,
  cssVar,
  sample,
}: TTypeSpecimenProps) => (
  <div className="flex flex-col gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0">
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-sm text-text">text-{name}</span>
      <ResolvedValue cssVar={cssVar} />
    </div>
    <p className={`font-body text-text ${sizeClassName}`}>{sample}</p>
  </div>
);
