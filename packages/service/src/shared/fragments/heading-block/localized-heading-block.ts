import { q } from '@blog/service/sanity/query';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params';
import { localizedField } from '@blog/service/shared/localization/localized-value';

export const localizedHeadingBlockFragment = q
  .parameters<TLocaleParams>()
  .fragmentForType<'localizedHeadingBlock'>()
  .project((sub) => ({
    heading: localizedField(sub, 'heading'),
    supportingText: localizedField(sub, 'supportingText'),
  }));
