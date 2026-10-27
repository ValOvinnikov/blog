import { CARD_IMAGE_SHAPE } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_TEAM_MEMBER_BIO,
  MOCK_TEAM_MEMBER_PROFILE_URL,
  mockTeamMember,
} from '@web/testing/modules/team/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { MOCK_GITHUB_PROFILE } from '@web/testing/shared/social-profile/fixtures';

import { TeamMemberCard } from './team-member-card';

vi.mock('@web/i18n/navigation');

const MOCK_MEMBER = mockTeamMember();
const MEMBER_INITIALS = 'JR';

const setup = customRender(TeamMemberCard, {
  member: MOCK_MEMBER,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  align: 'left',
});

describe(`<${TeamMemberCard.name}/>`, () => {
  describe('a member with no photo, profile page, bio or social links', () => {
    beforeEach(() => {
      setup();
    });

    it('renders initials, never an empty avatar', () => {
      const missingPhoto = screen.queryByRole('img');
      const initials = screen.getByText(MEMBER_INITIALS);

      expect(missingPhoto).not.toBeInTheDocument();
      expect(initials).toBeVisible();
    });

    it("renders the person's name as plain text", () => {
      const missingLink = screen.queryByRole('link', {
        name: MOCK_MEMBER.name,
      });
      const name = screen.getByText(MOCK_MEMBER.name, { ignore: '.sr-only' });

      expect(missingLink).not.toBeInTheDocument();
      expect(name).toBeVisible();
    });

    it('renders no bio or social links', () => {
      const missingBio = screen.queryByText(MOCK_TEAM_MEMBER_BIO);
      const missingSocialList = screen.queryByRole('list');

      expect(missingBio).not.toBeInTheDocument();
      expect(missingSocialList).not.toBeInTheDocument();
    });
  });

  it('renders the photo instead of the initials when the member has one', () => {
    setup({ member: mockTeamMember({ image: mockSanityImage() }) });

    const photo = screen.getByRole('img');
    const hiddenInitials = screen.queryByText(MEMBER_INITIALS);

    expect(photo).toBeVisible();
    expect(hiddenInitials).not.toBeInTheDocument();
  });

  it("links the person's name when a profile page is set", () => {
    setup({
      member: mockTeamMember({ profileUrl: MOCK_TEAM_MEMBER_PROFILE_URL }),
    });

    const profileLink = screen.getByRole('link', { name: MOCK_MEMBER.name });

    expect(profileLink).toHaveAttribute('href', MOCK_TEAM_MEMBER_PROFILE_URL);
  });

  it('renders the bio and social links when supplied', () => {
    setup({
      member: mockTeamMember({
        bio: [mockPortableTextBlock(MOCK_TEAM_MEMBER_BIO)],
        socialLinks: [MOCK_GITHUB_PROFILE],
      }),
    });

    const bio = screen.getByText(MOCK_TEAM_MEMBER_BIO);
    const socialLink = screen.getByRole('link', { name: 'GitHub profile' });

    expect(bio).toBeVisible();
    expect(socialLink).toHaveAttribute('href', MOCK_GITHUB_PROFILE.link.href);
  });
});
