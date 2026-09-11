import { HERO_VARIANT } from '@blog/config';
import type { THeroStatementModule } from '@blog/service';
import { Hero } from '@blog/ui/organisms/hero';
import { ActionGroup } from '@web/components/shared/action-group';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';

export interface IHeroStatementModuleViewProps extends THeroStatementModule {
  id: string;
}

/**
 * Pure view for `HeroStatementModule` — the web-side wiring the `@blog/ui`
 * `Hero` organism can't own itself: the `Section` full-bleed landmark, the
 * `SanityImage` bridge, and the authored actions via `ActionGroup`.
 */
export const HeroStatementModuleView = ({
  id,
  brandVariant,
  variant,
  eyebrow,
  heading,
  supportingText,
  sanityImage,
  actions,
  contentPosition,
  contentAlignment,
  mediaOrder,
  layout,
}: IHeroStatementModuleViewProps) => {
  const titleId = `hero-statement-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`hero-statement-module-${id}`}
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
        {actions && actions.length > 0 && (
          <Hero.Cta>
            <ActionGroup
              actions={actions}
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
