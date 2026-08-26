import { spinnerVariants, type TSpinnerVariants } from './spinner-variants';

export type TSpinnerProps = {
  label: string;
  hasLabel?: boolean;
  size?: TSpinnerVariants['size'];
  className?: string;
};

/**
 * The accessible name always comes from `label` via `aria-label` —
 * `role="status"` does not pick up name-from-content, so `hasLabel` only
 * controls whether that same text is *also* rendered visibly beside it.
 */
export const Spinner = ({
  label,
  hasLabel = false,
  size,
  className,
}: TSpinnerProps) => {
  const { root, glyph, text } = spinnerVariants({ size });

  return (
    <span
      role="status"
      aria-label={label}
      className={root({ class: className })}
    >
      <span className={glyph()} aria-hidden="true" />
      {hasLabel && (
        <span className={text()} aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
};
