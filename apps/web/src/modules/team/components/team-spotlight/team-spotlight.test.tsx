import { CARD_IMAGE_SHAPE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_TEAM_MEMBER_BIO,
  MOCK_TEAM_MEMBER_INITIALS,
  MOCK_TEAM_MEMBER_PROFILE_URL,
  mockTeamMember,
} from '@web/testing/modules/team/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { TeamSpotlight } from './team-spotlight';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_MEMBER = mockTeamMember();
const MOCK_MEMBER_ROLE = faker.person.jobTitle();

const setup = customRender(TeamSpotlight, {
  member: MOCK_MEMBER,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
});

describe(`<${TeamSpotlight.name}/>`, () => {
  describe('a member with no photo or profile page', () => {
    beforeEach(() => {
      setup();
    });

    it('renders initials, never an empty frame', () => {
      const missingPhoto = screen.queryByRole('img');
      const initials = screen.getByText(MOCK_TEAM_MEMBER_INITIALS);

      expect(missingPhoto).not.toBeInTheDocument();
      expect(initials).toBeVisible();
    });

    it("renders the person's name as an unlinked heading", () => {
      const missingLink = screen.queryByRole('link', {
        name: MOCK_MEMBER.name,
      });
      const heading = screen.getByRole('heading', {
        level: 3,
        name: MOCK_MEMBER.name,
      });

      expect(missingLink).not.toBeInTheDocument();
      expect(heading).toBeVisible();
    });
  });

  it('shows the photo and hides the initials when the member has one', () => {
    setup({ member: mockTeamMember({ image: mockSanityImage() }) });

    const photo = screen.getByRole('img');
    const hiddenInitials = screen.queryByText(MOCK_TEAM_MEMBER_INITIALS);

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

  it('renders no role or bio when none are supplied', () => {
    setup({ member: mockTeamMember({ role: undefined }) });

    const missingRole = screen.queryByText(MOCK_MEMBER_ROLE);
    const missingBio = screen.queryByText(MOCK_TEAM_MEMBER_BIO);

    expect(missingRole).not.toBeInTheDocument();
    expect(missingBio).not.toBeInTheDocument();
  });

  it('renders the role and bio when supplied', () => {
    setup({
      member: mockTeamMember({
        role: MOCK_MEMBER_ROLE,
        bio: [mockPortableTextBlock(MOCK_TEAM_MEMBER_BIO)],
      }),
    });

    const role = screen.getByText(MOCK_MEMBER_ROLE);
    const bio = screen.getByText(MOCK_TEAM_MEMBER_BIO);

    expect(role).toBeVisible();
    expect(bio).toBeVisible();
  });
});
