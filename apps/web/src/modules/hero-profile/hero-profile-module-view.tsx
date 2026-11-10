import { HERO_VARIANT } from '@blog/config';
import type { THeroProfileModule } from '@blog/service';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { Hero } from '@blog/ui/components/organisms/hero';
import { hasLength } from '@blog/utils/primitives';
import { HeroModuleShell } from '@web/components/shared/hero-module-shell';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SocialLinks } from '@web/components/shared/social-links';

import {
  heroProfileAvatarFallbackVariants,
  heroProfileAvatarVariants,
  heroProfileNameVariants,
  heroProfilePortraitVariants,
} from './hero-profile-module-view-variants';

export interface IHeroProfileModuleViewProps {
  id: string;
  module: THeroProfileModule;
}

export const HeroProfileModuleView = ({
  id,
  module,
}: IHeroProfileModuleViewProps) => {
  const {
    brandVariant,
    presentation,
    eyebrow,
    headingBlock,
    avatarName,
    sanityImage,
    bio,
    socialLinks,
    ctaButtons,
    layout,
  } = module;
  const { variant } = presentation;
  const { heading, supportingText } = headingBlock;
  const isBanner = variant === HERO_VARIANT.BANNER;

  return (
    <HeroModuleShell
      brandVariant={brandVariant}
      presentation={presentation}
      eyebrow={eyebrow}
      title={heading}
      excerpt={supportingText}
      layout={layout}
      dataTestId={`hero-profile-module-${id}`}
      ctaButtons={ctaButtons}
      sanityImage={undefined}
    >
      {variant === HERO_VARIANT.STACKED && (
        <Hero.Avatar>
          {sanityImage ? (
            <SanityImage
              image={sanityImage}
              width={256}
              height={256}
              className={heroProfileAvatarVariants()}
            />
          ) : (
            <Avatar
              alt={avatarName}
              name={avatarName}
              className={heroProfileAvatarFallbackVariants()}
            />
          )}
        </Hero.Avatar>
      )}

      {variant === HERO_VARIANT.SPLIT && sanityImage && (
        <Hero.Media ratio="square" className={heroProfilePortraitVariants()}>
          <SanityImage
            image={sanityImage}
            width={900}
            height={900}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="size-full object-cover"
          />
        </Hero.Media>
      )}

      {variant === HERO_VARIANT.SPLIT && !sanityImage && (
        <Hero.Avatar className="mb-0">
          <span className={heroProfileNameVariants()}>{avatarName}</span>
        </Hero.Avatar>
      )}

      {isBanner && sanityImage && (
        <Hero.Media>
          <SanityImage
            image={sanityImage}
            width={1200}
            height={675}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={true}
            className="size-full object-cover"
            alt=""
          />
        </Hero.Media>
      )}

      {bio && hasLength(bio) && (
        <Hero.Body>
          <PortableText value={bio} />
        </Hero.Body>
      )}

      {hasLength(socialLinks) && (
        <Hero.Social>
          <SocialLinks
            profiles={socialLinks}
            variant="outlined"
            isOnDark={isBanner}
          />
        </Hero.Social>
      )}
    </HeroModuleShell>
  );
};
