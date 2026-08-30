import type { THeroModule } from '@blog/service';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { Hero } from '@blog/ui/organisms/hero';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

import { heroHiddenLabelVariants } from './hero-module-variants';

export interface IHeroModuleViewProps extends Omit<THeroModule, 'title'> {
  id: string;
  title: string;
  baseUrl: string;
}

/**
 * Pure view for `HeroModule` — the web-side wiring the `@blog/ui` `Hero`
 * organism can't own itself: the `Section` full-bleed landmark for the
 * CMS-authored `brandVariant`/`layout`, `SmartLink`-composed CTAs, the
 * `SanityImage` bridge, and the visually-hidden CTA label suffix.
 */
export const HeroModuleView = ({
  id,
  brandVariant,
  eyebrow,
  title,
  subtitle,
  sanityImage,
  primaryAction,
  secondaryAction,
  layout,
  baseUrl,
}: IHeroModuleViewProps) => {
  const titleId = `hero-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`hero-module-${id}`}
    >
      <Hero
        eyebrow={eyebrow}
        title={title}
        titleId={titleId}
        excerpt={subtitle}
      >
        {(primaryAction || secondaryAction) && (
          <Hero.Cta>
            {primaryAction && (
              <LinkButton
                as={SmartLink}
                href={primaryAction.href}
                target={primaryAction.target}
              >
                {primaryAction.label}
                {primaryAction.hiddenLabelSuffix && (
                  <span
                    className={heroHiddenLabelVariants()}
                  >{`: ${primaryAction.hiddenLabelSuffix}`}</span>
                )}
              </LinkButton>
            )}
            {secondaryAction && (
              <LinkButton
                as={SmartLink}
                href={secondaryAction.href}
                target={secondaryAction.target}
                variant="link"
                aria-label={secondaryAction.ariaLabel}
              >
                {secondaryAction.label}
              </LinkButton>
            )}
          </Hero.Cta>
        )}

        {sanityImage && (
          <Hero.Media key="media">
            {/* 1200x675 (16:9) is pre-cropped into the source URL and degrades gracefully at Hero.Media's `lg` 4:3 breakpoint too (verified visually); 1200x900 would crop below `lg`. */}
            <SanityImage
              image={sanityImage}
              baseUrl={baseUrl}
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
