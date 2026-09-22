import {
  toSocialProfile,
  type TRawSocialProfile,
  type TSocialProfile,
} from '@blog/service/shared/transformers/social-profile/to-social-profile';

export function toSocialProfiles(
  raw: TRawSocialProfile[] | null | undefined,
): TSocialProfile[] {
  return (raw ?? []).flatMap((item) => toSocialProfile(item) ?? []);
}
