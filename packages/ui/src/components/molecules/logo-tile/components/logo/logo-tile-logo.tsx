import type { CSSProperties, ReactNode } from 'react';

import {
  logoTileLogoVariants,
  type TLogoTileLogoVariants,
} from './logo-tile-logo-variants';

export type TLogoTileLogoProps = {
  children: ReactNode;
  hasAspectRatio: boolean;
  aspectRatioOverride?: number;
  visibleIn?: TLogoTileLogoVariants['visibleIn'];
};

export const LogoTileLogo = ({
  children,
  hasAspectRatio,
  aspectRatioOverride,
  visibleIn,
}: TLogoTileLogoProps) => (
  <div
    className={logoTileLogoVariants({ hasAspectRatio, visibleIn })}
    style={
      aspectRatioOverride !== undefined
        ? ({ '--logo-aspect': aspectRatioOverride } as CSSProperties)
        : undefined
    }
  >
    {children}
  </div>
);
