import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
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
      hasAspectRatio: !isUndefined(aspectRatio),
      class: className,
    })}
    style={
      isUndefined(aspectRatio)
        ? undefined
        : ({ '--logo-aspect': aspectRatio } as CSSProperties)
    }
    data-testid={dataTestId}
  >
    {children}
  </div>
);
