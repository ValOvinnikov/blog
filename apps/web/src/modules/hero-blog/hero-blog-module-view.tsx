import type { THeroBlogModule } from '@blog/service';
import { Hero } from '@blog/ui/organisms/hero';
import {
  ActionGroup,
  type TActionGroupAction,
} from '@web/components/shared/action-group';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';

export interface IHeroBlogModuleViewProps extends Omit<
  THeroBlogModule,
  'heading'
> {
  id: string;
  heading: string;
}

/**
 * Pure view for `HeroBlogModule` — the web-side wiring the `@blog/ui` `Hero`
 * organism can't own itself: the `Section` full-bleed landmark, the
 * `SanityImage` bridge, and the primary/secondary CTAs via `ActionGroup`.
 */
export const HeroBlogModuleView = ({
  id,
  brandVariant,
  variant,
  eyebrow,
  heading,
  supportingText,
  sanityImage,
  primaryAction,
  secondaryAction,
  contentPosition,
  contentAlignment,
  mediaOrder,
  layout,
}: IHeroBlogModuleViewProps) => {
  const titleId = `hero-blog-${id}`;
  const actions = [primaryAction, secondaryAction].filter(
    (action): action is TActionGroupAction => Boolean(action),
  );

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`hero-blog-module-${id}`}
    >
      <Hero
        variant={variant}
        eyebrow={eyebrow}
        title={heading}
        titleId={titleId}
        excerpt={supportingText}
        contentPosition={contentPosition}
        contentAlignment={contentAlignment}
        mediaOrder={mediaOrder}
      >
        {actions.length > 0 && (
          <Hero.Cta>
            <ActionGroup actions={actions} />
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
