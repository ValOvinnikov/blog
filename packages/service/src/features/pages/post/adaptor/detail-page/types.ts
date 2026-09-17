import type {
  ISanityImage,
  ProseText,
  TMaybeUndefined,
  TPagePostType,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';
import type { TPortableTextBody } from '@blog/service/shared/transformers/to-portable-text-body';
import type { TPortableTextBlockWithResolvedLinks } from '@blog/service/shared/transformers/to-portable-text-mark-def';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { TSocialProfile } from '@blog/service/shared/transformers/to-social-profile';
import type { TTag } from '@blog/service/shared/transformers/to-tag';
import type { TTopic } from '@blog/service/shared/transformers/to-topic';

export type TPostDetailAuthor = {
  id: string;
  name: string;
  profilePageHref: TMaybeUndefined<string>;
  image: TMaybeUndefined<ISanityImage>;
  role: TMaybeUndefined<string>;
  bio: TMaybeUndefined<
    Array<TPortableTextBlockWithResolvedLinks<ProseText[number]>>
  >;
  socialLinks: TSocialProfile[];
};

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
};
