import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import { toPersonProfile } from '@blog/service/shared/transformers/person/to-person-profile';
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
  const person = toPersonProfile(raw);

  return {
    id: person.id,
    name: person.name,
    image: person.image,
    role: person.role,
    bio: showBios ? person.bio : undefined,
    socialLinks: showSocialLinks ? person.socialLinks : [],
    profileUrl: person.profileUrl,
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
