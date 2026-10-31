import { q } from '@blog/service/sanity/query/query';
import { linkRefFragment } from '@blog/service/shared/fragments/link/link-ref';
import { socialProfileFragment } from '@blog/service/shared/fragments/social-profile/social-profile';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const footerQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('settings_footer')
  .slice(0)
  .project((sub) => ({
    social: sub.field('social[]').project(socialProfileFragment).nullable(true),
    groups: sub
      .field('groups[]')
      .project((group) => ({
        heading: getLocalizedField(group, 'heading'),
        links: group.field('links[]').project(linkRefFragment).nullable(true),
      }))
      .nullable(true),
    about: getLocalizedField(sub, 'about'),
    address: getLocalizedField(sub, 'address'),
    finePrint: sub
      .field('finePrint[]')
      .project((item) => ({
        _type: true,
        ...item.conditionalByType({ linkRef: linkRefFragment }),
      }))
      .nullable(true),
    showLanguageSwitcher: sub.field('showLanguageSwitcher').nullable(true),
    showRssFeed: sub.field('showRssFeed').nullable(true),
  }))
  .notNull();
