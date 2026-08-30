import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { resolveComponent, type IWithIcon } from '@blog/ui/lib/react';
import type { ElementType } from 'react';

import { navLinkVariants, type TNavLinkVariants } from './nav-link-variants';

type TNavLinkOwnProps = {
  className?: string;
  isActive?: TNavLinkVariants['isActive'];
  /**
   * Whether the link's text renders visibly. Set to `false` to visually hide
   * it while keeping it in the DOM as the link's real accessible name, so the
   * link renders icon-only without losing a screen-reader-announced name.
   * Meaningful only alongside `icon`.
   */
  hasLabel?: boolean;
} & IWithIcon &
  IWithDataTestId;

export type TNavLinkProps<C extends ElementType = 'a'> = TPolymorphicProps<
  C,
  TNavLinkOwnProps
>;

/**
 * NavLink atom — a chrome-level navigation link (header/footer nav items).
 * Renders its `children` as visible label text by default; pass `icon` for a
 * leading icon next to the label, and `hasLabel={false}` to render icon-only
 * while the label keeps supplying the link's accessible name. When the label
 * is hidden and `children` is plain text, that text is also set as a `title`
 * attribute so sighted mouse users get a hover tooltip (same convention as
 * other icon-only interactive elements in this library, e.g. `ThemeToggle`).
 */
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
