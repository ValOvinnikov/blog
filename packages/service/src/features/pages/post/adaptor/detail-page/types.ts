import type { TMaybeUndefined, TPagePostType } from '@shinefold/config';
import type { TPageTranslation } from '@shinefold/service/shared/localization/page-translations/to-page-translations';
import type { TModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TPersonProfile } from '@shinefold/service/shared/transformers/person/to-person-profile';
import type { TPortableTextBody } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-body';
import type { TPostCard } from '@shinefold/service/shared/transformers/post/to-post-card';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';
import type { TTag } from '@shinefold/service/shared/transformers/tag/to-tag';
import type { TTopic } from '@shinefold/service/shared/transformers/topic/to-topic';

export type TPostDetailAuthor = TPersonProfile;

export type TPostTakeaways = {
  takeaways: string[];
  generatedAt: TMaybeUndefined<string>;
  model: TMaybeUndefined<string>;
};

export type TPostDetail = Omit<TPostCard, 'author' | 'topic'> & {
  body: TPortableTextBody;
  postTakeaways: TMaybeUndefined<TPostTakeaways>;
  hasAsides: boolean;
  seo: TSeoResolved;
  author: TPostDetailAuthor;
  topic: TTopic;
  tags: TTag[];
  modules: TModule<TPagePostType>[];
  readingTimeMinutes: number;
  translations: TPageTranslation[];
};
