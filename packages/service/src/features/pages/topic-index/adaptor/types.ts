import type {
  THeadingAlignment,
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicIndexType,
} from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';

export type TTopicIndexPage = {
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPageTopicIndexType>>;
  modules: TModule<TPageTopicIndexType>[];
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
