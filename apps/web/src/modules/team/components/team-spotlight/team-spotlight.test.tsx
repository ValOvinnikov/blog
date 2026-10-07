import { CARD_IMAGE_SHAPE } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeTeamMember } from '@web/testing/modules/team/fixtures';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { TeamSpotlight } from './team-spotlight';

vi.mock('@web/i18n/navigation');

const member = makeTeamMember();

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
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('JR')).toBeVisible();
      unmount();

      setup({ member: makeTeamMember({ image: makeSanityImage() }) });

      expect(screen.getByRole('img')).toBeVisible();
      expect(screen.queryByText('JR')).not.toBeInTheDocument();
    });

    it("links the person's name only when a profile page is set", () => {
      expect(
        screen.queryByRole('link', { name: member.name }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: member.name }),
      ).toBeVisible();
      unmount();

      setup({ member: makeTeamMember({ profileUrl: '/team/jordan-reyes' }) });

      expect(screen.getByRole('link', { name: member.name })).toHaveAttribute(
        'href',
        '/team/jordan-reyes',
      );
    });
  });

  it('renders the role and bio only when the loader supplied them', () => {
    const { unmount } = setup({ member: makeTeamMember({ role: undefined }) });

    expect(screen.queryByText('VP Engineering')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Builds resilient distributed systems.'),
    ).not.toBeInTheDocument();
    unmount();

    setup({
      member: makeTeamMember({
        bio: [portableTextBlock('Builds resilient distributed systems.')],
      }),
    });

    expect(screen.getByText('VP Engineering')).toBeVisible();
    expect(
      screen.getByText('Builds resilient distributed systems.'),
    ).toBeVisible();
  });
});
