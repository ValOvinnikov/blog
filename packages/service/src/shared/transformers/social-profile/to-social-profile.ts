import type { ILink, TMaybeUndefined, TSocialPlatform } from '@blog/config';
import type { socialProfileFragment } from '@blog/service/shared/fragments/social-profile/social-profile';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document/to-link-document';
import type { InferFragmentType } from 'groqd';

export type TRawSocialProfile = InferFragmentType<typeof socialProfileFragment>;

export type TSocialProfile = {
  platform: TSocialPlatform;
  link: ILink;
};

export function toSocialProfile(
  raw: TRawSocialProfile,
): TMaybeUndefined<TSocialProfile> {
  const link = toLinkDocument(raw.link);
  if (!link) return undefined;

  return { platform: raw.platform, link };
}
