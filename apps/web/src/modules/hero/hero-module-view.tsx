import type { THeroModule } from '@blog/service';
import { LinkButton } from '@blog/ui/molecules';
import { Hero } from '@blog/ui/organisms';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

import { heroHiddenLabelVariants } from './hero-module-variants';

export interface IHeroModuleViewProps extends Omit<THeroModule, 'title'> {
  id: string;
  title: string;
  projectId: string;
  dataset: string;
}

/**
 * Pure view for `HeroModule` — the web-side wiring the `@blog/ui` `Hero`
 * organism can't own itself: the `Section` full-bleed landmark for the
 * CMS-authored `brandVariant`/`layout`, `SmartLink`-composed CTAs, the
 * `SanityImage` bridge, and the visually-hidden CTA label suffix.
 */
export function HeroModuleView({
  id,
  brandVariant,
  eyebrow,
  title,
  subtitle,
  sanityImage,
  primaryAction,
  secondaryAction,
  layout,
  projectId,
  dataset,
}: IHeroModuleViewProps) {
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
            {/*
              SanityImage bakes a hotspot-aware crop into the source URL at
              this exact width/height — not just a CSS `object-fit` concern,
              the source is pre-cropped before any responsive CSS runs.
              Hero.Media is responsive (16:9 below `lg`, 4:3 at `lg` and up)
              but this component only accepts one non-responsive ratio;
              1200x675 (16:9) degrades gracefully at both breakpoints
              (verified visually), while 1200x900 (4:3) visibly crops the
              image on tablet/below-`lg` viewports.
            */}
            <SanityImage
              image={sanityImage}
              projectId={projectId}
              dataset={dataset}
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
}
