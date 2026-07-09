import { ResolvedValue } from './resolved-value';

export type TSpacingSampleProps = {
  /** Utility class applying the spacing token as a width, e.g. `w-gutter`. */
  spacingClassName: string;
  /** Token name as used in utilities, e.g. `gutter`. */
  name: string;
  /** Underlying CSS custom property, e.g. `--spacing-gutter`. */
  cssVar: string;
};

/**
 * A single spacing-token sample: a bar rendered at the token's width, plus
 * the utility name and its resolved value.
 */
export const SpacingSample = ({
  spacingClassName,
  name,
  cssVar,
}: TSpacingSampleProps) => (
  <div className="flex items-center gap-4">
    <span
      className={`h-3 max-w-full shrink-0 rounded-sm bg-accent-solid ${spacingClassName}`}
      aria-hidden="true"
    />
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-sm text-text">{name}</span>
      <ResolvedValue cssVar={cssVar} />
    </div>
  </div>
);
