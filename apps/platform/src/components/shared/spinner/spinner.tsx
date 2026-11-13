import type { IWithClassName } from '@blog/config/types';

import { spinnerVariants, type TSpinnerVariants } from './spinner-variants';

export type TSpinnerProps = IWithClassName & {
  label: string;
  hasLabel?: boolean;
  size?: TSpinnerVariants['size'];
  tone?: TSpinnerVariants['tone'];
};

/** `role="status"` takes no name from content, so `label` is always the `aria-label`; `hasLabel` only also shows it. */
export const Spinner = ({
  label,
  hasLabel = false,
  size,
  tone,
  className,
}: TSpinnerProps) => {
  const { root, glyph, orbit, unlit, lit, text } = spinnerVariants({
    size,
    tone,
  });

  return (
    <span
      role="status"
      aria-label={label}
      className={root({ class: className })}
    >
      <span className={glyph()} aria-hidden="true">
        <span className={orbit()}>
          <span className={unlit()} />
          <span className={lit()} />
        </span>
      </span>
      {hasLabel && (
        <span className={text()} aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
};
