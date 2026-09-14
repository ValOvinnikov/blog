import type { ILink, TMaybeUndefined } from '@blog/config';
import type { socialLinkRefFragment } from '@blog/service/shared/fragments/social-link';
import { toLink } from '@blog/service/shared/transformers/to-link';
import type { InferFragmentType } from 'groqd';

export type TRawSocialLinkRef = InferFragmentType<typeof socialLinkRefFragment>;

export function toSocialLink(raw: TRawSocialLinkRef): TMaybeUndefined<ILink> {
  const link = toLink(raw);
  if (!link) return undefined;

  return { ...link, platform: raw.platform };
}
