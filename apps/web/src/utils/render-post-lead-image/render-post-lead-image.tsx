import type { TPostCard } from '@blog/service';
import { SanityImage } from '@web/components/shared/sanity-image';
import type { ReactNode } from 'react';

/**
 * Builds the `image` node a lead `PostCardItem` renders, or `undefined` when
 * the post has no hero image. Never sets `priority` — a spotlight lead never
 * owns the page's LCP hero.
 */
export const renderPostLeadImage = (post: TPostCard): ReactNode | undefined =>
  post.heroImage ? (
    <SanityImage
      image={post.heroImage}
      width={960}
      height={540}
      sizes="(min-width: 768px) 50vw, 100vw"
      loading="lazy"
      className="size-full object-cover"
    />
  ) : undefined;
