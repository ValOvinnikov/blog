import { HERO_VARIANT, SIZE } from '@blog/config';
import type { THeroProfileModule, TPortableTextBody } from '@blog/service';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Hero } from '@blog/ui/organisms/hero';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SocialLinks } from '@web/components/shared/social-links';
import { HeroModuleShell } from '@web/modules/hero-shared';

import {
  heroProfileAvatarFallbackVariants,
  heroProfileAvatarVariants,
  heroProfileMediaFallbackVariants,
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

      {variant === HERO_VARIANT.SPLIT && (
        <Hero.Media ratio="square">
          {sanityImage ? (
            <SanityImage
              image={sanityImage}
              width={900}
              height={900}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="size-full object-cover"
            />
          ) : (
            <div className={heroProfileMediaFallbackVariants()}>
              <Avatar alt={avatarName} name={avatarName} size={SIZE.XXL} />
            </div>
          )}
        </Hero.Media>
      )}

      {isBanner && (
        <Hero.Media>
          {sanityImage ? (
            <SanityImage
              image={sanityImage}
              width={1200}
              height={675}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority={true}
              className="size-full object-cover"
              alt=""
            />
          ) : (
            <div
              aria-hidden="true"
              className={heroProfileMediaFallbackVariants()}
            >
              <Avatar alt={avatarName} name={avatarName} size={SIZE.XXL} />
            </div>
          )}
        </Hero.Media>
      )}

      {bio && bio.length > 0 && (
        <Hero.Body>
          {/* `proseText`'s block style (bio) allows h1/h5/h6, a wider range than the `richText` (post body) `PortableTextRenderer` is typed against, though both share the same block/link shape. */}
          <PortableTextRenderer value={bio as TPortableTextBody} />
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
