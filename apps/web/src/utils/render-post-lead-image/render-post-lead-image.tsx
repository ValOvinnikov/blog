import type { TMaybeUndefined } from '@shinefold/config';
import type { TPostCard } from '@shinefold/service';
import { SanityImage } from '@web/components/shared/sanity-image';
import type { ReactNode } from 'react';

/** Never `priority`: a spotlight lead is never the page's LCP image. */
export const renderPostLeadImage = (
  post: TPostCard,
): TMaybeUndefined<ReactNode> =>
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
