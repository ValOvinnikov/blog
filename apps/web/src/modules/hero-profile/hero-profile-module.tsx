import { service } from '@blog/service';
import { SocialLinks } from '@web/components/shared/social-links';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { HeroProfileModuleView } from './hero-profile-module-view';

export interface IHeroProfileModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * HeroProfileModule — fetches `module_heroProfile` data, resolves the social
 * links list into `<li>` items, and hands both to `HeroProfileModuleView`.
 */
export const HeroProfileModule = async ({
  id,
  tenant,
}: IHeroProfileModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.heroProfile.v1.getHeroProfile(
    id,
    tenantContext,
  );

  if (!result.ok) return null;

  const { socialLinks, ...rest } = result.data;
  const t = await getTranslations('hero');

  const socialLinksItems: ReactNode =
    socialLinks.length > 0
      ? await Promise.all(
          socialLinks.map(async (profile) => (
            <li key={profile.link.href}>
              {await SocialLinks({ profiles: [profile] })}
            </li>
          )),
        )
      : undefined;

  return (
    <HeroProfileModuleView
      id={id}
      {...rest}
      socialLinksItems={socialLinksItems}
      socialLinksAriaLabel={t('socialLinksAriaLabel')}
    />
  );
};
