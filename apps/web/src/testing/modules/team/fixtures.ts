import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@shinefold/config';
import type { TTeamMember, TTeamModule } from '@shinefold/service';
import { createMockFaker } from '@web/testing/mock-faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

const mockFaker = createMockFaker(61043);

export const MOCK_TEAM_MEMBER_NAME = 'Jordan Reyes';

export const MOCK_TEAM_MEMBER_INITIALS = 'JR';

export const mockTeamMember = (
  overrides: Partial<TTeamMember> = {},
): TTeamMember => ({
  id: 'team-member-1',
  name: MOCK_TEAM_MEMBER_NAME,
  image: undefined,
  role: 'VP Engineering',
  bio: undefined,
  socialLinks: [],
  profileUrl: undefined,
  ...overrides,
});

export const MOCK_TEAM_HEADING = 'Meet the team';

export const MOCK_TEAM_MEMBERS: TTeamMember[] = [
  mockTeamMember(),
  mockTeamMember({ id: mockFaker.string.uuid(), name: 'Casey Morgan' }),
];

export const MOCK_TEAM_MEMBER_PROFILE_URL = '/team/jordan-reyes';

export const MOCK_TEAM_MEMBER_BIO = 'Builds resilient distributed systems.';

export const mockTeamModule = (
  overrides: Partial<TTeamModule> = {},
): TTeamModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_TEAM_HEADING }),
  members: MOCK_TEAM_MEMBERS,
  showBios: false,
  showSocialLinks: false,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  displayMode: DISPLAY_MODE.GRID,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});
