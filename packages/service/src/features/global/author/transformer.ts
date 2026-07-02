import type { InferResultType } from 'groqd';
import type { ImageWithAlt } from '@blog/types';
import { buildImageUrl } from '#/shared/to-post-card';
import type { TAuthorDetail, TSocialLink } from '#/shared/types';
import { authorQuery } from './query';

type TRawAuthor = NonNullable<InferResultType<typeof authorQuery>>;

export type { TAuthorDetail };

export function toAuthorDetail(raw: TRawAuthor): TAuthorDetail {
  const rawImage = raw.image as ImageWithAlt | null | undefined;
  return {
    id: raw._id,
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    role: raw.role ?? null,
    imageUrl: buildImageUrl(rawImage),
    bio: raw.bio ?? null,
    socialLinks: (raw.socialLinks ?? []).map(
      (link): TSocialLink => ({
        platform: link.platform ?? '',
        url: link.url ?? '',
      }),
    ),
  };
}
