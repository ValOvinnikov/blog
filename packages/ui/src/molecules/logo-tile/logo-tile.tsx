import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { logoTileVariants, type TLogoTileVariants } from './logo-tile-variants';

export type TLogoTileProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
    isInteractive?: TLogoTileVariants['isInteractive'];
  };

/** A fixed-size card that frames a single logo, so transparent and opaque-background assets sit inside identical bounds. */
export const LogoTile = ({
  children,
  isInteractive,
  className,
  dataTestId,
}: TLogoTileProps) => (
  <div
    className={logoTileVariants({ isInteractive, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
