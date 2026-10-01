import type { ISanityImage, TMaybeUndefined } from '@blog/config';
import type { personCardFragment } from '@blog/service/shared/fragments/person/person';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import type { InferFragmentType } from 'groqd';

export type TRawPersonCard = InferFragmentType<typeof personCardFragment>;

export type TPersonCard = {
  id: string;
  name: string;
  image: TMaybeUndefined<ISanityImage>;
  profileUrl: TMaybeUndefined<string>;
};

export function toPersonCard(raw: TRawPersonCard): TPersonCard {
  return {
    id: raw._id,
    name: raw.name,
    image: toSanityImage(raw.image),
    profileUrl: toLinkDocument(raw.profilePage)?.href,
  };
}
