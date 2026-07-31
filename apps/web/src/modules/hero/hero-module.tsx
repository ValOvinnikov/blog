import { service } from '@blog/service';
import { LinkButton } from '@blog/ui/molecules';
import { Hero } from '@blog/ui/organisms';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { env } from '@web/utils/env/env';

import { heroHiddenLabelVariants } from './hero-module-variants';

export interface IHeroModuleProps {
  id: string;
  locale: string;
}

/**
 * HeroModule — fetches `module_hero` data and renders it through the `Hero`
 * organism. The only place this module's service and ui meet.
 */
export async function HeroModule({ id }: IHeroModuleProps) {
  const result = await service.modules.hero.v1.getHero(id);

  if (!result.ok) return null;

  const {
    eyebrow,
    title,
    subtitle,
    sanityImage,
    primaryAction,
    secondaryAction,
  } = result.data;

  // No title resolved from CMS config or fallback featured post — never
  // render a Hero with an empty top-level <h1>.
  if (!title) return null;

  return (
    <Hero
      eyebrow={eyebrow}
      title={title}
      titleId="home-hero-title"
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
            SanityImage's `sanity-image` package bakes a hotspot-aware crop
            into the source URL at this exact width/height — it isn't just a
            CSS `object-fit` concern, the source is pre-cropped to this ratio
            before any responsive CSS ever runs. Hero.Media (`heroMediaVariants`)
            is responsive — `aspect-video` (16:9, `MediaFrame`'s default) below
            the `lg` breakpoint, `lg:aspect-[4/3]` at `lg` and up — but this
            component only accepts one non-responsive ratio. 1200x675 (16:9)
            degrades gracefully at both breakpoints (verified visually); 1200x900
            (4:3) visibly crops the image at the top on tablet/below-`lg`
            viewports, where the container itself is 16:9.
          */}
          <SanityImage
            image={sanityImage}
            projectId={env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            dataset={env.NEXT_PUBLIC_SANITY_DATASET}
            width={1200}
            height={675}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="size-full object-cover"
          />
        </Hero.Media>
      )}
    </Hero>
  );
}
