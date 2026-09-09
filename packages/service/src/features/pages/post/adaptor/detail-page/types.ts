import type {
  BlockText,
  TMaybeUndefined,
  TPortableTextBody,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { TSocialLink } from '@blog/service/shared/transformers/to-social-link';
import type { TTag } from '@blog/service/shared/transformers/to-tag';
import type { TTopic } from '@blog/service/shared/transformers/to-topic';

export type TPostDetailAuthor = {
  id: string;
  name: string;
  profilePageSlug: TMaybeUndefined<string>;
  imageUrl: TMaybeUndefined<string>;
  role: TMaybeUndefined<string>;
  bio: TMaybeUndefined<BlockText>;
  socialLinks: TSocialLink[];
};

export type TPostSkim = {
  takeaways: string[];
  generatedAt: TMaybeUndefined<string>;
  model: TMaybeUndefined<string>;
};

export type TPostDetail = Omit<TPostCard, 'author' | 'topic'> & {
  body: TMaybeUndefined<TPortableTextBody>;
  skim: TMaybeUndefined<TPostSkim>;
  hasAsides: boolean;
  seo: TSeoResolved;
  author: TMaybeUndefined<TPostDetailAuthor>;
  topic: TMaybeUndefined<TTopic>;
  tags: TTag[];
  modules: TModule[];
  readingTimeMinutes: number;
};
