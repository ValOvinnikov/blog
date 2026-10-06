import { q } from '@blog/service/sanity/query/query';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

export const moduleHeadingBlockFragment = q
  .parameters<TLocaleParams>()
  .fragmentForType<'moduleHeadingBlock'>()
  .project((sub) => ({
    heading: getLocalizedField(sub, 'heading').notNull(),
    supportingText: getLocalizedField(sub, 'supportingText'),
  }));
