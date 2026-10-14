import { spinnerVariants, type TSpinnerVariants } from './spinner-variants';

export type TSpinnerProps = {
  label: string;
  hasLabel?: boolean;
  size?: TSpinnerVariants['size'];
  className?: string;
};

/** `role="status"` takes no name from content, so `label` is always the `aria-label`; `hasLabel` only also shows it. */
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
