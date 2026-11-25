import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@shinefold/config';
import type { TRawTeamModule } from '@shinefold/service/features/modules/team/adaptor/transformer';
import { MOCK_PERSON_NAME } from '@shinefold/service/testing/modules/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { mockRawModuleAppearance } from '@shinefold/service/testing/shared/module-appearance';

type TRawTeamMember = TRawTeamModule['members'][number];

export const MOCK_TEAM_MODULE_ID = 'team-1';

export function mockRawTeamMember(
  overrides: Partial<TRawTeamMember> = {},
): TRawTeamMember {
  return {
    _id: 'person-1',
    name: MOCK_PERSON_NAME,
    image: null,
    profilePage: null,
    role: null,
    bio: null,
    socialLinks: null,
    ...overrides,
  };
}

export function mockRawTeamModule(
  overrides: Partial<TRawTeamModule> = {},
): TRawTeamModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawModuleHeadingBlock('Meet the team'),
    members: [
      mockRawTeamMember(),
      mockRawTeamMember({ _id: 'person-2', name: 'Alex Chen' }),
    ],
    showBios: false,
    showSocialLinks: true,
    imageShape: CARD_IMAGE_SHAPE.CIRCLE,
    displayMode: DISPLAY_MODE.GRID,
    cardAlignment: CONTENT_ALIGNMENT.CENTER,
    ctaButtons: null,
    contentAlignment: null,
    layout: null,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
