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
   * persistent live region, not from `aria-busy` or the visible label.
   */
  isPending?: boolean;
  /**
   * The single source of the pending-state text: shown as the button's own
   * label in place of `children` while pending, and announced through an
   * `aria-live="polite"` region whose text content toggles between empty and
   * this value. Passing `pendingLabel` at all (regardless of `isPending`)
   * mounts that region for this button's whole lifetime — a region inserted
   * only once already pending is commonly missed by screen readers, so it
   * must already exist before the text changes, not be created alongside it.
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
  const hasPendingLabel = pendingLabel !== undefined;
  const isPendingWithLabel = isPending && hasPendingLabel;
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
      {hasPendingLabel && (
        <span role="status" aria-live="polite" className={srOnlyStatus()}>
          {isPendingWithLabel ? pendingLabel : ''}
        </span>
      )}
    </>
  );
};
