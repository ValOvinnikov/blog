import type { InferResultType } from 'groqd';

import { buildImageUrl } from '#/shared/transformers/build-image-url';
import { toSocialLink } from '#/shared/transformers/to-social-link';

import type { authorQuery } from './query';
import type { TAuthorDetail } from './types';

export type TRawAuthor = NonNullable<InferResultType<typeof authorQuery>>;

export function toAuthorDetail(raw: TRawAuthor): TAuthorDetail {
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    role: raw.role ?? undefined,
    imageUrl: buildImageUrl(raw.image),
    bio: raw.bio ?? undefined,
    socialLinks: (raw.socialLinks ?? []).map(toSocialLink),
  };
}
