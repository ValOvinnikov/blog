import { A_AS_CONST, type IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { type IWithIcon } from '@blog/ui/lib/react';
import type { ElementType } from 'react';

import { navLinkVariants, type TNavLinkVariants } from './nav-link-variants';

type TNavLinkOwnProps = {
  className?: string;
  isActive?: TNavLinkVariants['isActive'];
  variant?: TNavLinkVariants['variant'];
  hasLabel?: boolean;
} & IWithIcon &
  IWithDataTestId;

export type TNavLinkProps<C extends ElementType = typeof A_AS_CONST> =
  TPolymorphicProps<C, TNavLinkOwnProps>;

/** A chrome-level navigation link (header/footer nav items). */
export const NavLink = <C extends ElementType = typeof A_AS_CONST>({
  isActive = false,
  variant = 'plain',
  className,
  dataTestId,
  as,
  icon,
  hasLabel = true,
  children,
  ...rest
}: TNavLinkProps<C>) => {
  const Component = as ?? A_AS_CONST;
  const { root, label } = navLinkVariants({ isActive, variant });
  const title =
    !hasLabel && typeof children === 'string' ? children : undefined;

  return (
    <Component
      className={root({ class: className })}
      aria-current={isActive ? 'page' : undefined}
      data-testid={dataTestId}
      title={title}
      {...rest}
    >
      {icon}
      {hasLabel ? children : <span className={label()}>{children}</span>}
    </Component>
  );
};
