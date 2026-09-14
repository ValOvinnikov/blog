import type { ILink, ISanityImage, TMaybeUndefined } from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';
import type { TPortableTextBody } from '@blog/service/shared/transformers/to-portable-text-body';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { TProseTextBody } from '@blog/service/shared/transformers/to-prose-text-body';
import type { TTag } from '@blog/service/shared/transformers/to-tag';
import type { TTopic } from '@blog/service/shared/transformers/to-topic';

export type TPostDetailAuthor = {
  id: string;
  name: string;
  profilePageSlug: TMaybeUndefined<string>;
  image: TMaybeUndefined<ISanityImage>;
  role: TMaybeUndefined<string>;
  bio: TMaybeUndefined<TProseTextBody>;
  socialLinks: ILink[];
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
  modules: TModule[];
  readingTimeMinutes: number;
};
