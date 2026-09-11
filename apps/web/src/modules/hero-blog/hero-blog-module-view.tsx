import { CTA_ACTION_VARIANT, HERO_VARIANT } from '@blog/config';
import type { THeroBlogModule, THeroPrimaryAction } from '@blog/service';
import { Hero } from '@blog/ui/organisms/hero';
import {
  ActionGroup,
  type IActionGroupAction,
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

const toActionGroupAction = (
  action: THeroPrimaryAction,
): IActionGroupAction => ({
  link: {
    label: action.label,
    href: action.href,
    target: action.target,
    platform: action.platform,
    ariaLabel: undefined,
  },
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: action.appearance,
  hiddenLabelSuffix: action.hiddenLabelSuffix,
});

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
  const actions = [
    primaryAction ? toActionGroupAction(primaryAction) : undefined,
    secondaryAction,
  ].filter((action): action is IActionGroupAction => Boolean(action));

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
        {actions.length > 0 && (
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
