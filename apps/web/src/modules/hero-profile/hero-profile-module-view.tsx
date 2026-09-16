import { HERO_VARIANT } from '@blog/config';
import type { THeroProfileModule } from '@blog/service';
import { Hero } from '@blog/ui/organisms/hero';
import { ActionGroup } from '@web/components/shared/action-group';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import type { ReactNode } from 'react';

export interface IHeroProfileModuleViewProps extends Omit<
  THeroProfileModule,
  'socialLinks'
> {
  id: string;
  socialLinksNode: ReactNode;
  socialLinksAriaLabel: string;
}

/**
 * Pure view for `HeroProfileModule` — the web-side wiring the `@blog/ui`
 * `Hero` organism can't own itself: the `Section` full-bleed landmark, the
 * `SanityImage` bridge for each variant's photo placement, the authored
 * `ctaButtons` via `ActionGroup`, and the labelled `<ul>` `Hero.Social` no
 * longer builds itself.
 */
export const HeroProfileModuleView = ({
  id,
  brandVariant,
  variant,
  eyebrow,
  headingBlock,
  sanityImage,
  socialLinksNode,
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
  const isStacked = variant === HERO_VARIANT.STACKED;
  const isSplit = variant === HERO_VARIANT.SPLIT;
  const hasSocialLinks = socialLinksNode != null;

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

        {sanityImage && isStacked && (
          <Hero.Avatar>
            <SanityImage
              image={sanityImage}
              width={256}
              height={256}
              className="size-24 rounded-full object-cover sm:size-32"
            />
          </Hero.Avatar>
        )}

        {sanityImage && isSplit && (
          <Hero.Media ratio="square">
            <SanityImage
              image={sanityImage}
              width={900}
              height={900}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority={true}
              className="size-full object-cover"
            />
          </Hero.Media>
        )}

        {sanityImage && isBanner && (
          <Hero.Media>
            <SanityImage
              image={sanityImage}
              width={1200}
              height={675}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority={true}
              className="size-full object-cover"
            />
          </Hero.Media>
        )}

        {hasSocialLinks && (
          <Hero.Social>
            <ul aria-label={socialLinksAriaLabel}>{socialLinksNode}</ul>
          </Hero.Social>
        )}
      </Hero>
    </Section>
  );
};
