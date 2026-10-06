import type { TMaybeUndefined, TPagePostType } from '@blog/config';
import type { TPageTranslation } from '@blog/service/shared/localization/page-translations/to-page-translations';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TPersonProfile } from '@blog/service/shared/transformers/person/to-person-profile';
import type { TPortableTextBody } from '@blog/service/shared/transformers/portable-text/to-portable-text-body';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { TTag } from '@blog/service/shared/transformers/tag/to-tag';
import type { TTopic } from '@blog/service/shared/transformers/topic/to-topic';

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
