import type {
  ISanityImage,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@blog/config';
import type { personDetailFragment } from '@blog/service/shared/fragments/person/person';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import { toPortableText } from '@blog/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { TSocialProfile } from '@blog/service/shared/transformers/social-profile/to-social-profile';
import { toSocialProfiles } from '@blog/service/shared/transformers/social-profile/to-social-profiles';
import type { InferFragmentType } from 'groqd';

export type TRawPersonProfile = InferFragmentType<typeof personDetailFragment>;

export type TPersonProfile = {
  id: string;
  name: string;
  image: TMaybeUndefined<ISanityImage>;
  role: TMaybeUndefined<string>;
  bio: TMaybeUndefined<TPortableTextBlock[]>;
  socialLinks: TSocialProfile[];
  profileUrl: TMaybeUndefined<string>;
};

export function toPersonProfile(raw: TRawPersonProfile): TPersonProfile {
  return {
    id: raw._id,
    name: raw.name,
    image: toSanityImage(raw.image),
    role: raw.role ?? undefined,
    bio: raw.bio?.map(toPortableText) ?? undefined,
    socialLinks: toSocialProfiles(raw.socialLinks),
    profileUrl: toLinkDocument(raw.profilePage)?.href,
  };
}
