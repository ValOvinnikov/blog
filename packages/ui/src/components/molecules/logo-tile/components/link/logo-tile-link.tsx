import {
  CardLink,
  type TCardLinkProps,
} from '@blog/ui/components/atoms/card-link';

import { logoTileLinkVariants } from './logo-tile-link-variants';

/** The link that makes a whole `LogoTile` its click target, wrapping the logo it names. */
export const LogoTileLink = ({
  href,
  linkAs,
  target,
  ariaLabel,
  children,
  className,
  dataTestId,
}: TCardLinkProps) => (
  <CardLink
    href={href}
    linkAs={linkAs}
    target={target}
    ariaLabel={ariaLabel}
    className={logoTileLinkVariants({ class: className })}
    dataTestId={dataTestId}
  >
    {children}
  </CardLink>
);
