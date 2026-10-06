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
  const { image, imageDark, link } = logo;

  const renderLogo = (logoImage: ISanityImage) => {
    const sanityImage = (
      <SanityImage
        image={logoImage}
        width={LOGO_IMAGE_WIDTH_PX}
        height={LOGO_IMAGE_HEIGHT_PX}
        mode="contain"
        loading="lazy"
      />
    );

    return link ? (
      <SmartLink
        href={link.href}
        target={link.target}
        aria-label={link.ariaLabel}
      >
        {sanityImage}
      </SmartLink>
    ) : (
      sanityImage
    );
  };

  return (
    <LogoTile
      isInteractive={Boolean(link)}
      aspectRatio={toAspectRatio(image)}
      darkLogo={imageDark && renderLogo(imageDark)}
      darkAspectRatio={imageDark && toAspectRatio(imageDark)}
      dataTestId="logo-wall-tile"
    >
      {renderLogo(image)}
    </LogoTile>
  );
};
