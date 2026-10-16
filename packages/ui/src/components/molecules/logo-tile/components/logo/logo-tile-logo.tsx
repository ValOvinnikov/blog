import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { CSSProperties, ReactNode } from 'react';

import { logoTileLogoVariants } from './logo-tile-logo-variants';

export type TLogoTileLogoProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
    aspectRatio?: number;
  };

/** The slot that sizes the tile's logo, by the asset's aspect ratio when one is given. */
export const LogoTileLogo = ({
  children,
  aspectRatio,
  className,
  dataTestId,
}: TLogoTileLogoProps) => (
  <div
    className={logoTileLogoVariants({
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
