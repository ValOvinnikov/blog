import { CTA_ACTION_VARIANT } from '@blog/config';
import type { THeroBlogModule } from '@blog/service';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { Hero } from '@blog/ui/organisms/hero';
import {
  ActionGroup,
  toButtonVariant,
} from '@web/components/shared/action-group';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

import { heroBlogHiddenLabelVariants } from './hero-blog-module-variants';

export interface IHeroBlogModuleViewProps extends Omit<
  THeroBlogModule,
  'heading'
> {
  id: string;
  heading: string;
}

/**
 * Pure view for `HeroBlogModule` — the web-side wiring the `@blog/ui` `Hero`
 * organism can't own itself: the `Section` full-bleed landmark, `SmartLink`-
 * composed CTAs, the `SanityImage` bridge, and the visually-hidden CTA label
 * suffix.
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
        {(primaryAction || secondaryAction) && (
          <Hero.Cta>
            {primaryAction && (
              <LinkButton
                as={SmartLink}
                href={primaryAction.href}
                target={primaryAction.target}
                variant={toButtonVariant(
                  CTA_ACTION_VARIANT.PRIMARY,
                  primaryAction.appearance,
                )}
              >
                {primaryAction.label}
                {primaryAction.hiddenLabelSuffix && (
                  <span
                    className={heroBlogHiddenLabelVariants()}
                  >{`: ${primaryAction.hiddenLabelSuffix}`}</span>
                )}
              </LinkButton>
            )}
            {secondaryAction && <ActionGroup actions={[secondaryAction]} />}
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
