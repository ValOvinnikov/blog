import { HERO_VARIANT } from '@blog/config';
import type { THeroProfileModule } from '@blog/service';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Hero } from '@blog/ui/organisms/hero';
import { InlineTextRenderer } from '@web/components/shared/inline-text-renderer';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SocialLinks } from '@web/components/shared/social-links';
import { HeroModuleShell } from '@web/modules/hero-shared';

import {
  heroProfileAvatarFallbackVariants,
  heroProfileAvatarVariants,
  heroProfileNameVariants,
  heroProfilePortraitVariants,
} from './hero-profile-module-view-variants';

export interface IHeroProfileModuleViewProps extends THeroProfileModule {
  id: string;
}

export const HeroProfileModuleView = ({
  id,
  brandVariant,
  variant,
  eyebrow,
  headingBlock,
  avatarName,
  sanityImage,
  bio,
  socialLinks,
  ctaButtons,
  contentPosition,
  contentAlignment,
  mediaOrder,
  layout,
}: IHeroProfileModuleViewProps) => {
  const titleId = `hero-profile-${id}`;
  const { heading, supportingText } = headingBlock;
  const isBanner = variant === HERO_VARIANT.BANNER;

  return (
    <HeroModuleShell
      brandVariant={brandVariant}
      variant={variant}
      eyebrow={eyebrow}
      title={heading}
      titleId={titleId}
      excerpt={supportingText}
      contentPosition={contentPosition}
      contentAlignment={contentAlignment}
      mediaOrder={mediaOrder}
      layout={layout}
      dataTestId={`hero-profile-module-${id}`}
      ctaButtons={ctaButtons}
      ctaClassName="mt-0"
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

      {bio && bio.length > 0 && (
        <Hero.Body>
          <InlineTextRenderer value={bio} />
        </Hero.Body>
      )}

      {socialLinks.length > 0 && (
        <Hero.Social>
          <SocialLinks profiles={socialLinks} variant="outlined" />
        </Hero.Social>
      )}
    </HeroModuleShell>
  );
};
