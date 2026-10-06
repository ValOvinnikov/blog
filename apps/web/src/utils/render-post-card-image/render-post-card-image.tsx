import type { TPostCard } from '@blog/service';
import { SanityImage } from '@web/components/shared/sanity-image';
import {
  SQUARE_IMAGE_SIZE,
  WIDE_IMAGE_HEIGHT,
} from '@web/utils/media-card-image-size';
import type { ReactNode } from 'react';

export const renderPostCardImage = (post: TPostCard): ReactNode | undefined =>
  post.heroImage ? (
    <SanityImage
      image={post.heroImage}
      width={SQUARE_IMAGE_SIZE}
      height={WIDE_IMAGE_HEIGHT}
      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
      loading="lazy"
      className="size-full object-cover"
    />
  ) : undefined;
