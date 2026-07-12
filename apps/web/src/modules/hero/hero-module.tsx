import { service } from '@blog/service';
import { Hero, LinkButton } from '@blog/ui';

import { SanityImage } from '@/components/sanity-image/sanity-image';
import { SmartLink } from '@/components/smart-link/smart-link';

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

  return (
    <Hero
      eyebrow={eyebrow}
      title={title ?? ''}
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
