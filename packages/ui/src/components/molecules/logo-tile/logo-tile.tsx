import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TCompoundComponent } from '@blog/ui/lib/react';
import type { CSSProperties, ElementType, ReactNode } from 'react';

import { LogoTileLink } from './components/link/logo-tile-link';
import { LogoTileLogo } from './components/logo/logo-tile-logo';
import { logoTileVariants, type TLogoTileVariants } from './logo-tile-variants';

const LogoTileParts = {
  Link: LogoTileLink,
} satisfies Record<string, ElementType>;

export type TLogoTileProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
    isInteractive?: TLogoTileVariants['isInteractive'];
    aspectRatio?: number;
    darkLogo?: ReactNode;
    darkAspectRatio?: number;
  };

/** A fixed-size card that frames a single logo, so transparent and opaque-background assets sit inside identical bounds. */
const LogoTileRoot = ({
  children,
  isInteractive,
  aspectRatio,
  darkLogo,
  darkAspectRatio,
  className,
  dataTestId,
}: TLogoTileProps) => {
  const hasDarkLogo = darkLogo !== undefined && darkLogo !== null;

  return (
    <div
      className={logoTileVariants({ isInteractive, class: className })}
      style={
        aspectRatio !== undefined
          ? ({ '--logo-aspect': aspectRatio } as CSSProperties)
          : undefined
      }
      data-testid={dataTestId}
    >
      <LogoTileLogo
        hasAspectRatio={aspectRatio !== undefined}
        visibleIn={hasDarkLogo ? 'light' : 'all'}
      >
        {children}
      </LogoTileLogo>
      {hasDarkLogo && (
        <LogoTileLogo
          hasAspectRatio={darkAspectRatio !== undefined}
          aspectRatioOverride={darkAspectRatio}
          visibleIn="dark"
        >
          {darkLogo}
        </LogoTileLogo>
      )}
    </div>
  );
};

export const LogoTile: TCompoundComponent<
  typeof LogoTileRoot,
  typeof LogoTileParts
> = Object.assign(LogoTileRoot, LogoTileParts);
