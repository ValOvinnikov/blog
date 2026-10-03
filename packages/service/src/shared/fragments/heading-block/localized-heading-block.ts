import { q } from '@blog/service/sanity/query';
import { localizedEntries } from '@blog/service/shared/localization/localized-entries';

export const localizedHeadingBlockFragment = q
  .fragmentForType<'localizedHeadingBlock'>()
  .project((sub) => ({
    heading: localizedEntries(sub, 'heading'),
    supportingText: localizedEntries(sub, 'supportingText'),
  }));
