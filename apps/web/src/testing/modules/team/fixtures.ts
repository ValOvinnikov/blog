import type { TTeamMember } from '@blog/service';
import { createMockFaker } from '@web/testing/mock-faker';

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
