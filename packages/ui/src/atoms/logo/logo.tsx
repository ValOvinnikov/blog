import { type HTMLAttributes } from 'react';

import { logoVariants } from './logo-variants';

export interface ILogoProps extends HTMLAttributes<HTMLSpanElement> {
  prefix: string;
  suffix?: string;
}

/**
 * Logo atom — renders a brand mark with an optional monospace accent suffix.
 *
 * @example
 * <Logo prefix="Val." suffix="dev" />
 */
export const Logo = ({ prefix, suffix, className, ...rest }: ILogoProps) => {
  const { root, suffix: suffixSlot } = logoVariants();
  return (
    <span className={root({ class: className })} {...rest}>
      {prefix}
      {suffix !== undefined && <span className={suffixSlot()}>{suffix}</span>}
    </span>
  );
};
