import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { logoTileVariants, type TLogoTileVariants } from './logo-tile-variants';

export type TLogoTileProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
    isInteractive?: TLogoTileVariants['isInteractive'];
  };

/** Carries no surface, border, or shadow, deliberately: a card promises a click most logos don't have. */
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
