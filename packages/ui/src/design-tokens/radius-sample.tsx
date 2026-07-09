import { ResolvedValue } from './resolved-value';

export type TRadiusSampleProps = {
  /** Utility class applying the radius token, e.g. `rounded-lg`. */
  radiusClassName: string;
  /** Token name as used in utilities, e.g. `lg`. */
  name: string;
  /** Underlying CSS custom property, e.g. `--radius-lg`. */
  cssVar: string;
};

/**
 * A single radius-token sample: a filled square rendered at the token's
 * corner radius, plus the utility name and its resolved pixel value.
 */
export const RadiusSample = ({
  radiusClassName,
  name,
  cssVar,
}: TRadiusSampleProps) => (
  <div className="flex items-center gap-4">
    <span
      className={`h-12 w-12 shrink-0 border border-border-strong bg-surface-2 ${radiusClassName}`}
      aria-hidden="true"
    />
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-sm text-text">rounded-{name}</span>
      <ResolvedValue cssVar={cssVar} />
    </div>
  </div>
);
