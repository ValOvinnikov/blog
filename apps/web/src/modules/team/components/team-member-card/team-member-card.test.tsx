import { CARD_IMAGE_SHAPE } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_TEAM_MEMBER_BIO,
  MOCK_TEAM_MEMBER_PROFILE_URL,
  mockTeamMember,
} from '@web/testing/modules/team/fixtures';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { mockSocialProfile } from '@web/testing/shared/social-profile/fixtures';

import { TeamMemberCard } from './team-member-card';

vi.mock('@web/i18n/navigation');

const member = mockTeamMember();
const GITHUB_PROFILE = mockSocialProfile();

const setup = customRender(TeamMemberCard, {
  member,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  align: 'left',
});

describe(`<${TeamMemberCard.name}/>`, () => {
  let unmount: () => void;

  beforeEach(() => {
    ({ unmount } = setup());
  });

  it('renders initials, never an empty avatar, when the member has no photo', () => {
    const missingPhoto = screen.queryByRole('img');
    const initials = screen.getByText('JR');
    expect(missingPhoto).not.toBeInTheDocument();
    expect(initials).toBeVisible();
    unmount();

    setup({ member: mockTeamMember({ image: mockSanityImage() }) });

    const photo = screen.getByRole('img');
    const hiddenInitials = screen.queryByText('JR');
    expect(photo).toBeVisible();
    expect(hiddenInitials).not.toBeInTheDocument();
  });

  it("links the person's name only when a profile page is set", () => {
    const missingLink = screen.queryByRole('link', { name: member.name });
    const name = screen.getByText(member.name, { ignore: '.sr-only' });
    expect(missingLink).not.toBeInTheDocument();
    expect(name).toBeVisible();
    unmount();

    setup({
      member: mockTeamMember({ profileUrl: MOCK_TEAM_MEMBER_PROFILE_URL }),
    });

    const profileLink = screen.getByRole('link', { name: member.name });
    expect(profileLink).toHaveAttribute('href', MOCK_TEAM_MEMBER_PROFILE_URL);
  });

  it('renders the bio and social links only when supplied', () => {
    const missingBio = screen.queryByText(MOCK_TEAM_MEMBER_BIO);
    const missingSocialList = screen.queryByRole('list');
    expect(missingBio).not.toBeInTheDocument();
    expect(missingSocialList).not.toBeInTheDocument();
    unmount();

    setup({
      member: mockTeamMember({
        bio: [portableTextBlock(MOCK_TEAM_MEMBER_BIO)],
        socialLinks: [GITHUB_PROFILE],
      }),
    });

    const bio = screen.getByText(MOCK_TEAM_MEMBER_BIO);
    const socialLink = screen.getByRole('link', { name: 'GitHub profile' });
    expect(bio).toBeVisible();
    expect(socialLink).toHaveAttribute('href', GITHUB_PROFILE.link.href);
  });
});
