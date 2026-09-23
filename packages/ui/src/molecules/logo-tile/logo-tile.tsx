import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { logoTileVariants, type TLogoTileVariants } from './logo-tile-variants';

export type TLogoTileProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
    isInteractive?: TLogoTileVariants['isInteractive'];
  };

/** LogoTile — A surface-less holder that centres one logo mark; the consumer supplies the image and any link, and the mark's own alt text is its accessible name. */
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
