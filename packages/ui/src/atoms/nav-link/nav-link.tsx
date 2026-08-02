import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { IWithIcon } from '@blog/ui/lib/react';
import type { ElementType } from 'react';

import { navLinkVariants } from './nav-link-variants';

type TNavLinkOwnProps = {
  className?: string;
  isActive?: boolean;
  /**
   * Visually hides the link's text content instead of removing it — the text
   * stays in the DOM as the link's real accessible name, so the link renders
   * icon-only without losing a screen-reader-announced name. Meaningful only
   * alongside `icon`.
   */
  hideLabel?: boolean;
} & IWithIcon &
  IWithDataTestId;

export type TNavLinkProps<C extends ElementType = 'a'> = TPolymorphicProps<
  C,
  TNavLinkOwnProps
>;

/**
 * NavLink atom — a chrome-level navigation link (header/footer nav items).
 * Renders its `children` as visible label text by default; pass `icon` for a
 * leading icon next to the label, and `hideLabel` to render icon-only while
 * the label keeps supplying the link's accessible name. When `hideLabel` is
 * set and `children` is plain text, that text is also set as a `title`
 * attribute so sighted mouse users get a hover tooltip (same convention as
 * other icon-only interactive elements in this library, e.g. `ThemeToggle`).
 */
export const NavLink = <C extends ElementType = 'a'>({
  isActive = false,
  className,
  dataTestId,
  as,
  icon,
  hideLabel = false,
  children,
  ...rest
}: TNavLinkProps<C>) => {
  const Component = (as ?? 'a') as ElementType;
  const { root, label } = navLinkVariants({ isActive });
  const title =
    hideLabel && typeof children === 'string' ? children : undefined;

  return (
    <Component
      className={root({ class: className })}
      aria-current={isActive ? 'page' : undefined}
      data-testid={dataTestId}
      title={title}
      {...rest}
    >
      {icon}
      {hideLabel ? <span className={label()}>{children}</span> : children}
    </Component>
  );
};
