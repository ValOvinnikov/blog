import type { TTeamMember } from '@blog/service';

export const makeTeamMember = (
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
