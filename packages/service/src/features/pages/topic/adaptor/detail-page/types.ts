import type {
  THeadingAlignment,
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicType,
} from '@shinefold/config';
import type { TPageTranslation } from '@shinefold/service/shared/localization/page-translations/to-page-translations';
import type { TModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';
import type { TTopic } from '@shinefold/service/shared/transformers/topic/to-topic';

export type TTopicDetailPageDocument = {
  topic: TTopic;
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPageTopicType>>;
  modules: TModule<TPageTopicType>[];
  seo: TSeoResolved;
  translations: TPageTranslation[];
};
