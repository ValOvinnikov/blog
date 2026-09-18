import { HERO_VARIANT, SIZE } from '@blog/config';
import type { THeroProfileModule } from '@blog/service';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Hero } from '@blog/ui/organisms/hero';
import { ActionGroup } from '@web/components/shared/action-group';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import type { ReactNode } from 'react';

import {
  heroProfileAvatarFallbackVariants,
  heroProfileAvatarVariants,
  heroProfileMediaFallbackVariants,
} from './hero-profile-module-view-variants';

export interface IHeroProfileModuleViewProps extends Omit<
  THeroProfileModule,
  'socialLinks'
> {
  id: string;
  socialLinksItems?: ReactNode;
  socialLinksAriaLabel: string;
}

/**
 * Pure view for `HeroProfileModule` — the web-side wiring the `@blog/ui`
 * `Hero` organism can't own itself: the `Section` full-bleed landmark, the
 * photo's placement per variant (a `SanityImage` when one resolves, an
 * `Avatar` initials badge when it doesn't), the authored `ctaButtons` via
 * `ActionGroup`, and the labelled `<ul>` `Hero.Social` no longer builds
 * itself.
 */
export const HeroProfileModuleView = ({
  id,
  brandVariant,
  variant,
  eyebrow,
  headingBlock,
  sanityImage,
  socialLinksItems,
  socialLinksAriaLabel,
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
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`hero-profile-module-${id}`}
    >
      <Hero
        tone={brandVariant}
        variant={variant}
        eyebrow={eyebrow}
        title={heading}
        titleId={titleId}
        excerpt={supportingText}
        contentPosition={contentPosition}
        contentAlignment={contentAlignment}
        mediaOrder={mediaOrder}
      >
        {ctaButtons.length > 0 && (
          <Hero.Cta>
            <ActionGroup actions={ctaButtons} isOnDark={isBanner} />
          </Hero.Cta>
        )}

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
                alt={heading}
                name={heading}
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
                <Avatar alt={heading} name={heading} size={SIZE.XXL} />
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
              />
            ) : (
              <div className={heroProfileMediaFallbackVariants()}>
                <Avatar alt={heading} name={heading} size={SIZE.XXL} />
              </div>
            )}
          </Hero.Media>
        )}

        {socialLinksItems && (
          <Hero.Social>
            <ul aria-label={socialLinksAriaLabel}>{socialLinksItems}</ul>
          </Hero.Social>
        )}
      </Hero>
    </Section>
  );
};
