import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import { toPortableText } from '@blog/service/shared/transformers/portable-text/to-portable-text-mark-def';
import { toSocialProfiles } from '@blog/service/shared/transformers/social-profile/to-social-profiles';
import type { InferResultType } from 'groqd';

import type { teamModuleQuery } from './query';
import type { TTeamMember, TTeamModule } from './types';

export type TRawTeamModule = InferResultType<typeof teamModuleQuery>;

type TRawTeamMember = TRawTeamModule['members'][number];

function toTeamMember(
  raw: TRawTeamMember,
  showBios: boolean,
  showSocialLinks: boolean,
): TTeamMember {
  return {
    id: raw._id,
    name: raw.name,
    image: toSanityImage(raw.image),
    role: raw.role ?? undefined,
    bio: showBios ? (raw.bio?.map(toPortableText) ?? undefined) : undefined,
    socialLinks: showSocialLinks ? toSocialProfiles(raw.socialLinks) : [],
    profileUrl: toLinkDocument(raw.profilePage)?.href,
  };
}

export function toTeamModule(raw: TRawTeamModule): TTeamModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    members: raw.members.map((member) =>
      toTeamMember(member, raw.showBios, raw.showSocialLinks),
    ),
    showBios: raw.showBios,
    showSocialLinks: raw.showSocialLinks,
    imageShape: raw.imageShape,
    displayMode: raw.displayMode,
    cardAlignment: raw.cardAlignment,
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
