import type {
  ISanityImage,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@shinefold/config';
import type { personDetailFragment } from '@shinefold/service/shared/fragments/person/person';
import { toPersonCard } from '@shinefold/service/shared/transformers/person/to-person-card';
import { toPortableText } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { TSocialProfile } from '@shinefold/service/shared/transformers/social-profile/to-social-profile';
import { toSocialProfiles } from '@shinefold/service/shared/transformers/social-profile/to-social-profiles';
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
    ...toPersonCard(raw),
    role: raw.role ?? undefined,
    bio: raw.bio?.map(toPortableText) ?? undefined,
    socialLinks: toSocialProfiles(raw.socialLinks),
  };
}
