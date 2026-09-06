import { SIZE } from '@blog/config';
import { Spinner } from '@platform/components/shared/spinner';
import type { AriaAttributes, MouseEventHandler, ReactNode } from 'react';

import { buttonVariants, type TButtonVariants } from './button-variants';

export type TButtonProps = {
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  type?: 'button' | 'submit' | 'reset';
  isDisabled?: boolean;
  /**
   * Shows a spinner ahead of the label, sets `aria-busy`, and disables the
   * button (native `disabled`, so a click/Enter/Space can never double-submit).
   * A native-`disabled` control is force-blurred and stops being tracked by
   * assistive tech, so the actual announcement comes from `pendingLabel`'s
   * screen-reader-only live region, not from `aria-busy` or the visible label.
   */
  isPending?: boolean;
  /**
   * The single source of the pending-state text: shown as the button's own
   * label in place of `children`, and announced through a visually-hidden
   * `Spinner` (its `role="status"` + `aria-label` is what a live region
   * needs — that role has no "name from content") whenever `isPending` is
   * true.
   */
  pendingLabel?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
  className?: string;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  /** Appends a decorative arrow, hidden from the accessible name. */
  hasArrow?: boolean;
};

export const Button = ({
  variant,
  size,
  type = 'button',
  isDisabled,
  isPending = false,
  pendingLabel,
  onClick,
  children,
  className,
  'aria-describedby': ariaDescribedBy,
  hasArrow,
}: TButtonProps) => {
  const { root, srOnlyStatus } = buttonVariants({ variant, size });
  const isPendingWithLabel = isPending && pendingLabel !== undefined;
  const label = isPendingWithLabel ? pendingLabel : children;

  return (
    <>
      <button
        type={type}
        disabled={isDisabled || isPending}
        aria-busy={isPending}
        onClick={onClick}
        className={root({ class: className })}
        aria-describedby={ariaDescribedBy}
      >
        {isPending && (
          <span aria-hidden="true">
            <Spinner label="" size={SIZE.SM} />
          </span>
        )}
        {label}
        {hasArrow && <span aria-hidden="true"> →</span>}
      </button>
      {isPendingWithLabel && (
        <Spinner
          label={pendingLabel}
          hasLabel={true}
          className={srOnlyStatus()}
        />
      )}
    </>
  );
};
