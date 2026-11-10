import {
  HERO_VARIANT,
  type ISanityImage,
  type IWithDataTestId,
  type TBrandVariant,
  type TLayout,
  type TMaybeUndefined,
} from '@blog/config';
import type { TCtaButton, THeroPresentation } from '@blog/service';
import { Hero, type THeroProps } from '@blog/ui/components/organisms/hero';
import { hasLength } from '@blog/utils/primitives';
import { ActionGroup } from '@web/components/shared/action-group';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import { resolveHeroLayout } from '@web/utils/resolve-hero-layout';
import { useId } from 'react';

export interface IHeroModuleShellProps extends IWithDataTestId {
  brandVariant: TBrandVariant;
  presentation: THeroPresentation;
  eyebrow: TMaybeUndefined<string>;
  title: string;
  excerpt: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
  ctaButtons: TCtaButton[];
  sanityImage: TMaybeUndefined<ISanityImage>;
  children?: THeroProps['children'];
}

export const HeroModuleShell = ({
  brandVariant,
  presentation,
  eyebrow,
  title,
  excerpt,
  layout,
  dataTestId,
  ctaButtons,
  sanityImage,
  children,
}: IHeroModuleShellProps) => {
  const titleId = useId();
  const { variant, contentPosition, contentAlignment, mediaOrder } =
    presentation;
  const isBanner = variant === HERO_VARIANT.BANNER;
  const {
    sectionBrandVariant,
    sectionLayout,
    heroSpacingTop,
    heroSpacingBottom,
  } = resolveHeroLayout({ variant, brandVariant, layout });
  const heroChildren = [
    hasLength(ctaButtons) && (
      <Hero.Cta>
        <ActionGroup actions={ctaButtons} isOnDark={isBanner} />
      </Hero.Cta>
    ),
    sanityImage && (
      <Hero.Media key="media">
        <SanityImage
          image={sanityImage}
          width={1200}
          height={675}
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={true}
          className="size-full object-cover"
          alt={isBanner ? '' : undefined}
        />
      </Hero.Media>
    ),
    children,
  ].flat() as THeroProps['children'];

  return (
    <Section
      brandVariant={sectionBrandVariant}
      layout={sectionLayout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <Hero
        tone={brandVariant}
        variant={variant}
        eyebrow={eyebrow}
        title={title}
        titleId={titleId}
        excerpt={excerpt}
        contentPosition={contentPosition}
        contentAlignment={contentAlignment}
        mediaOrder={mediaOrder}
        spacingTop={heroSpacingTop}
        spacingBottom={heroSpacingBottom}
      >
        {heroChildren}
      </Hero>
    </Section>
  );
};
