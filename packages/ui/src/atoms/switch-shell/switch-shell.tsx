import type { IWithDataTestId } from '@blog/config';
import type { ButtonHTMLAttributes, Ref } from 'react';

import { switchShellVariants } from './switch-shell-variants';

export interface ISwitchShellProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, IWithDataTestId {
  ref?: Ref<HTMLButtonElement>;
}

const s = switchShellVariants();

/**
 * SwitchShell — the visual appearance of an on/off toggle. A headless
 * behavior library (e.g. Base UI's `Switch.Root`, via its `render` prop)
 * supplies the interaction and drives the on/off/disabled look through
 * `data-checked`/`data-disabled` attributes on this element; the shell
 * itself owns no state and reads none of these as props.
 */
export const SwitchShell = ({
  className,
  dataTestId,
  ref,
  type = 'button',
  ...rest
}: ISwitchShellProps) => (
  <button
    {...rest}
    ref={ref}
    type={type}
    data-testid={dataTestId}
    className={s.root({ class: className })}
  >
    <span
      aria-hidden="true"
      data-testid="switch-shell-thumb"
      className={s.thumb()}
    />
  </button>
);
