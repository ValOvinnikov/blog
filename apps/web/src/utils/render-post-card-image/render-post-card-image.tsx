import type { TPostCard } from '@blog/service';
import { SanityImage } from '@web/components/shared/sanity-image';
import type { ReactNode } from 'react';

/**
 * Builds the `image` node a `PostCardItem` renders, or `undefined` when the
 * post has no hero image.
 */
export const renderPostCardImage = (post: TPostCard): ReactNode | undefined =>
  post.heroImage ? (
    <SanityImage
      image={post.heroImage}
      width={640}
      height={360}
      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
      loading="lazy"
      className="size-full object-cover"
    />
  ) : undefined;
