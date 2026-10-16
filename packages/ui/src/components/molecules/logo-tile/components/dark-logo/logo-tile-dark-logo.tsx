import {
  LogoTileLogo,
  type TLogoTileLogoProps,
} from '@blog/ui/components/molecules/logo-tile/components/logo/logo-tile-logo';

import { logoTileDarkLogoVariants } from './logo-tile-dark-logo-variants';

/** The slot for the logo asset made for dark backgrounds, shown in dark mode only. */
export const LogoTileDarkLogo = ({
  children,
  aspectRatio,
  className,
  dataTestId,
}: TLogoTileLogoProps) => (
  <LogoTileLogo
    aspectRatio={aspectRatio}
    className={logoTileDarkLogoVariants({ class: className })}
    dataTestId={dataTestId}
  >
    {children}
  </LogoTileLogo>
);
