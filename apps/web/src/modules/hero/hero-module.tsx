import { service } from '@blog/service';
import { LinkButton } from '@blog/ui/molecules';
import { Hero } from '@blog/ui/organisms';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';

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
            </LinkButton>
          )}
          {secondaryAction && (
            <LinkButton
              as={SmartLink}
              href={secondaryAction.href}
              target={secondaryAction.target}
              variant="link"
            >
              {secondaryAction.label}
            </LinkButton>
          )}
        </Hero.Cta>
      )}

      {sanityImage && (
        <Hero.Media key="media">
          <SanityImage
            image={sanityImage}
            width={1200}
            height={900}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="size-full object-cover"
          />
        </Hero.Media>
      )}
    </Hero>
  );
}
