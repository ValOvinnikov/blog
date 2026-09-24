import type { TLogoItem } from '@blog/service';
import { LogoTile } from '@blog/ui/components/molecules/logo-tile';
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

  const rawAspectRatio = logo.image.dimensions?.aspectRatio;
  const aspectRatio =
    rawAspectRatio !== undefined &&
    Number.isFinite(rawAspectRatio) &&
    rawAspectRatio > 0
      ? rawAspectRatio
      : undefined;

  return (
    <LogoTile
      isInteractive={Boolean(logo.link)}
      aspectRatio={aspectRatio}
      dataTestId="logo-wall-tile"
    >
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
