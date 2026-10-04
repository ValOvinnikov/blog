import { q } from '@blog/service/sanity/query';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

export const localizedHeadingBlockFragment = q
  .parameters<TLocaleParams>()
  .fragmentForType<'localizedHeadingBlock'>()
  .project((sub) => ({
    heading: getLocalizedField(sub, (filter) =>
      sub.field('heading[]').filterBy(filter).slice(0).field('value'),
    ).notNull(),
    supportingText: getLocalizedField(sub, (filter) =>
      sub.field('supportingText[]').filterBy(filter).slice(0).field('value'),
    ),
  }));
