import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { resolveComponent, type IWithIcon } from '@blog/ui/lib/react';
import type { ElementType } from 'react';

import { navLinkVariants, type TNavLinkVariants } from './nav-link-variants';

type TNavLinkOwnProps = {
  className?: string;
  isActive?: TNavLinkVariants['isActive'];
  hasLabel?: boolean;
} & IWithIcon &
  IWithDataTestId;

export type TNavLinkProps<C extends ElementType = 'a'> = TPolymorphicProps<
  C,
  TNavLinkOwnProps
>;

/** A chrome-level navigation link (header/footer nav items). */
export const NavLink = <C extends ElementType = 'a'>({
  isActive = false,
  className,
  dataTestId,
  as,
  icon,
  hasLabel = true,
  children,
  ...rest
}: TNavLinkProps<C>) => {
  const Component = resolveComponent(as, 'a');
  const { root, label } = navLinkVariants({ isActive });
  const title =
    !hasLabel && typeof children === 'string' ? children : undefined;

  return (
    // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `as`/fallback verbatim, so the reference stays stable across renders
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
