import type { TTeamMember } from '@blog/service';
import { faker } from '@faker-js/faker';

export const mockTeamMember = (
  overrides: Partial<TTeamMember> = {},
): TTeamMember => ({
  id: 'team-member-1',
  name: 'Jordan Reyes',
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
  mockTeamMember({ id: faker.string.uuid(), name: 'Casey Morgan' }),
];

export const MOCK_TEAM_MEMBER_PROFILE_URL = '/team/jordan-reyes';

export const MOCK_TEAM_MEMBER_BIO = 'Builds resilient distributed systems.';
