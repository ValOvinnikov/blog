import type { ISanityImage, TMaybeUndefined } from '@blog/config';
import type { TLogoItem } from '@blog/service';
import { LogoTile } from '@blog/ui/components/molecules/logo-tile';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';

const LOGO_IMAGE_HEIGHT_PX = 72;
const LOGO_IMAGE_WIDTH_PX = 360;

export interface ILogoWallTileProps {
  logo: TLogoItem;
}

const toAspectRatio = (image: ISanityImage): TMaybeUndefined<number> => {
  const rawAspectRatio = image.dimensions?.aspectRatio;

  return rawAspectRatio !== undefined &&
    Number.isFinite(rawAspectRatio) &&
    rawAspectRatio > 0
    ? rawAspectRatio
    : undefined;
};

export const LogoWallTile = ({ logo }: ILogoWallTileProps) => {
  const { name, image, imageDark, link } = logo;
  const logoAlt = link ? '' : undefined;

  const renderImage = (logoImage: ISanityImage) => (
    <SanityImage
      image={logoImage}
      alt={logoAlt}
      width={LOGO_IMAGE_WIDTH_PX}
      height={LOGO_IMAGE_HEIGHT_PX}
      mode="contain"
      loading="lazy"
    />
  );

  return (
    <LogoTile isInteractive={Boolean(link)} dataTestId="logo-wall-tile">
      <LogoTile.Logo
        aspectRatio={toAspectRatio(image)}
        dataTestId="logo-wall-tile-logo"
      >
        {renderImage(image)}
      </LogoTile.Logo>
      {imageDark && (
        <LogoTile.DarkLogo aspectRatio={toAspectRatio(imageDark)}>
          {renderImage(imageDark)}
        </LogoTile.DarkLogo>
      )}
      {link && (
        <LogoTile.Link
          href={link.href}
          target={link.target}
          ariaLabel={link.ariaLabel ?? name}
          as={SmartLink}
        />
      )}
    </LogoTile>
  );
};
