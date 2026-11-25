import { q } from '@shinefold/service/sanity/query/query';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@shinefold/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';

export const moduleHeadingBlockFragment = q
  .parameters<TLocaleQueryParams>()
  .fragmentForType<'moduleHeadingBlock'>()
  .project((sub) => ({
    heading: getLocalizedPortableTextBlock(sub, 'heading').notNull(),
    supportingText: getLocalizedField(sub, 'supportingText'),
  }));
