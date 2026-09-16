import { service } from '@blog/service';
import { SocialLinks } from '@web/components/shared/social-links';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { getTranslations } from 'next-intl/server';

import { HeroProfileModuleView } from './hero-profile-module-view';

export interface IHeroProfileModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * HeroProfileModule — fetches `module_heroProfile` data, pre-renders the
 * `socialLinks` array through `SocialLinks` (wrapped as `<li>`s for the
 * view's `<ul>`), and hands both to `HeroProfileModuleView`.
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

  const socialLinksNode =
    socialLinks.length > 0
      ? await SocialLinks({ social: socialLinks, itemAs: 'li' })
      : null;

  return (
    <HeroProfileModuleView
      id={id}
      {...rest}
      socialLinksNode={socialLinksNode}
      socialLinksAriaLabel={t('socialLinksAriaLabel')}
    />
  );
};
