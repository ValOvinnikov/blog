import { q } from '@shinefold/service/sanity/query/query';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';

export const moduleHeadingBlockFragment = q
  .parameters<TLocaleQueryParams>()
  .fragmentForType<'moduleHeadingBlock'>()
  .project((sub) => ({
    heading: getLocalizedField(sub, 'heading').notNull(),
    supportingText: getLocalizedField(sub, 'supportingText'),
  }));
