import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import { toSocialLink } from '@blog/service/shared/transformers/to-social-link';
import type { InferResultType } from 'groqd';

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
