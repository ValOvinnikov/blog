import type { BlockText, RichText, TMaybeUndefined } from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { TSocialLink } from '@blog/service/shared/transformers/to-social-link';
import type { TTag } from '@blog/service/shared/transformers/to-tag';
import type { TTopic } from '@blog/service/shared/transformers/to-topic';

export type TPostDetailAuthor = {
  id: string;
  name: string;
  slug: string;
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
  body: RichText;
  skim: TMaybeUndefined<TPostSkim>;
  hasAsides: boolean;
  seo: TSeoResolved;
  author: TPostDetailAuthor;
  topic: TTopic;
  tags: TTag[];
  relatedPosts: TPostCard[];
  readingTimeMinutes: number;
  newsletterEnabled: boolean;
};
