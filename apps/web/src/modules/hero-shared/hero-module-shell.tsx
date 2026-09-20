import {
  HERO_VARIANT,
  type ISanityImage,
  type IWithDataTestId,
  type TContentAlignment,
  type TFullBrandVariant,
  type THeroVariant,
  type TLayout,
  type TMaybeUndefined,
  type TMediaOrder,
} from '@blog/config';
import type { TCtaButton } from '@blog/service';
import { Hero, type THeroProps } from '@blog/ui/organisms/hero';
import { ActionGroup } from '@web/components/shared/action-group';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';

export interface IHeroModuleShellProps extends IWithDataTestId {
  brandVariant: TFullBrandVariant;
  variant: THeroVariant;
  eyebrow: TMaybeUndefined<string>;
  title: string;
  titleId: string;
  excerpt: TMaybeUndefined<string>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
  layout: TMaybeUndefined<TLayout>;
  ctaButtons: TCtaButton[];
  sanityImage: TMaybeUndefined<ISanityImage>;
  children?: THeroProps['children'];
}

export const HeroModuleShell = ({
  brandVariant,
  variant,
  eyebrow,
  title,
  titleId,
  excerpt,
  contentPosition,
  contentAlignment,
  mediaOrder,
  layout,
  dataTestId,
  ctaButtons,
  sanityImage,
  children,
}: IHeroModuleShellProps) => {
  const heroChildren = [
    ctaButtons.length > 0 && (
      <Hero.Cta>
        <ActionGroup
          actions={ctaButtons}
          isOnDark={variant === HERO_VARIANT.BANNER}
        />
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
          alt={variant === HERO_VARIANT.BANNER ? '' : undefined}
        />
      </Hero.Media>
    ),
    children,
  ].flat() as THeroProps['children'];

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
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
      >
        {heroChildren}
      </Hero>
    </Section>
  );
};
