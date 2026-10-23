import { CARD_IMAGE_SHAPE } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_TEAM_MEMBER_BIO,
  MOCK_TEAM_MEMBER_PROFILE_URL,
  mockTeamMember,
} from '@web/testing/modules/team/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { TeamSpotlight } from './team-spotlight';

vi.mock('@web/i18n/navigation');

const member = mockTeamMember();

const MEMBER_ROLE = 'Staff Engineer';

const setup = customRender(TeamSpotlight, {
  member,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
});

describe(`<${TeamSpotlight.name}/>`, () => {
  describe('with the default member', () => {
    let unmount: () => void;

    beforeEach(() => {
      ({ unmount } = setup());
    });

    it('renders initials, never an empty frame, when the member has no photo', () => {
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
      const heading = screen.getByRole('heading', {
        level: 3,
        name: member.name,
      });
      expect(missingLink).not.toBeInTheDocument();
      expect(heading).toBeVisible();
      unmount();

      setup({
        member: mockTeamMember({ profileUrl: MOCK_TEAM_MEMBER_PROFILE_URL }),
      });

      const profileLink = screen.getByRole('link', { name: member.name });
      expect(profileLink).toHaveAttribute('href', MOCK_TEAM_MEMBER_PROFILE_URL);
    });
  });

  it('renders the role and bio only when supplied', () => {
    const { unmount } = setup({ member: mockTeamMember({ role: undefined }) });

    const missingRole = screen.queryByText(MEMBER_ROLE);
    const missingBio = screen.queryByText(MOCK_TEAM_MEMBER_BIO);
    expect(missingRole).not.toBeInTheDocument();
    expect(missingBio).not.toBeInTheDocument();
    unmount();

    setup({
      member: mockTeamMember({
        role: MEMBER_ROLE,
        bio: [mockPortableTextBlock(MOCK_TEAM_MEMBER_BIO)],
      }),
    });

    const role = screen.getByText(MEMBER_ROLE);
    const bio = screen.getByText(MOCK_TEAM_MEMBER_BIO);
    expect(role).toBeVisible();
    expect(bio).toBeVisible();
  });
});
