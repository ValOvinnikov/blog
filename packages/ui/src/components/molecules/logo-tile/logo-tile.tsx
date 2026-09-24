import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { CSSProperties, ReactNode } from 'react';

import { logoTileVariants, type TLogoTileVariants } from './logo-tile-variants';

export type TLogoTileProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
    isInteractive?: TLogoTileVariants['isInteractive'];
    aspectRatio?: number;
  };

/** A fixed-size card that frames a single logo, so transparent and opaque-background assets sit inside identical bounds. */
export const LogoTile = ({
  children,
  isInteractive,
  aspectRatio,
  className,
  dataTestId,
}: TLogoTileProps) => (
  <div
    className={logoTileVariants({
      isInteractive,
      hasAspectRatio: aspectRatio !== undefined,
      class: className,
    })}
    style={
      aspectRatio !== undefined
        ? ({ '--logo-aspect': aspectRatio } as CSSProperties)
        : undefined
    }
    data-testid={dataTestId}
  >
    {children}
  </div>
);
