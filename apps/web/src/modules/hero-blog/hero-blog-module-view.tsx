import { HERO_VARIANT } from '@blog/config';
import type { THeroBlogModule } from '@blog/service';
import { Hero } from '@blog/ui/organisms/hero';
import { ActionGroup } from '@web/components/shared/action-group';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';

export interface IHeroBlogModuleViewProps extends Extract<
  THeroBlogModule,
  { hasPost: true }
> {
  id: string;
}

/**
 * Pure view for `HeroBlogModule` — the web-side wiring the `@blog/ui` `Hero`
 * organism can't own itself: the `Section` full-bleed landmark, the
 * `SanityImage` bridge, and the resolved `ctaButtons` via `ActionGroup`.
 */
export const HeroBlogModuleView = ({
  id,
  brandVariant,
  variant,
  eyebrow,
  heading,
  supportingText,
  sanityImage,
  ctaButtons,
  contentPosition,
  contentAlignment,
  mediaOrder,
  layout,
}: IHeroBlogModuleViewProps) => {
  const titleId = `hero-blog-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`hero-blog-module-${id}`}
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
            <ActionGroup
              actions={ctaButtons}
              isOnDark={variant === HERO_VARIANT.BANNER}
            />
          </Hero.Cta>
        )}

        {sanityImage && (
          <Hero.Media key="media">
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
      </Hero>
    </Section>
  );
};
