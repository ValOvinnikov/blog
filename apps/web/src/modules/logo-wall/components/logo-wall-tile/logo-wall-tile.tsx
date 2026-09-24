import type { TLogoItem } from '@blog/service';
import { LogoTile } from '@blog/ui/molecules/logo-tile';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';

const LOGO_IMAGE_HEIGHT_PX = 72;
const LOGO_IMAGE_WIDTH_PX = 360;

export interface ILogoWallTileProps {
  logo: TLogoItem;
}

export const LogoWallTile = ({ logo }: ILogoWallTileProps) => {
  const image = (
    <SanityImage
      image={logo.image}
      width={LOGO_IMAGE_WIDTH_PX}
      height={LOGO_IMAGE_HEIGHT_PX}
      mode="contain"
      loading="lazy"
    />
  );

  return (
    <LogoTile isInteractive={Boolean(logo.link)}>
      {logo.link ? (
        <SmartLink
          href={logo.link.href}
          target={logo.link.target}
          aria-label={logo.link.ariaLabel}
        >
          {image}
        </SmartLink>
      ) : (
        image
      )}
    </LogoTile>
  );
};
