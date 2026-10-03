import { q } from '@blog/service/sanity/query';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params';

export const localizedHeadingBlockFragment = q
  .parameters<TLocaleParams>()
  .fragmentForType<'localizedHeadingBlock'>()
  .project((sub) => ({
    heading: sub.coalesce(
      sub
        .field('heading[]')
        .filterBy('language == $locale')
        .slice(0)
        .field('value'),
      sub
        .field('heading[]')
        .filterBy('language == $defaultLocale')
        .slice(0)
        .field('value'),
    ),
    supportingText: sub.coalesce(
      sub
        .field('supportingText[]')
        .filterBy('language == $locale')
        .slice(0)
        .field('value'),
      sub
        .field('supportingText[]')
        .filterBy('language == $defaultLocale')
        .slice(0)
        .field('value'),
    ),
  }));
