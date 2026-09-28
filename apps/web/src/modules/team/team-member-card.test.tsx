import { CARD_IMAGE_SHAPE, SOCIAL_PLATFORMS } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeTeamMember } from '@web/testing/modules/team/fixtures';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { TeamMemberCard } from './team-member-card';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const member = makeTeamMember();

const setup = customRender(TeamMemberCard, {
  member,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  align: 'left',
  imageSizes: '100vw',
});

describe(`<${TeamMemberCard.name}/>`, () => {
  it('renders initials, never an empty avatar, when the member has no photo', () => {
    const { unmount } = setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JR')).toBeVisible();
    unmount();

    setup({ member: makeTeamMember({ image: makeSanityImage() }) });

    expect(screen.getByRole('img')).toBeVisible();
    expect(screen.queryByText('JR')).not.toBeInTheDocument();
  });

  it("links the person's name only when a profile page is set", () => {
    const { unmount } = setup();

    expect(
      screen.queryByRole('link', { name: member.name }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(member.name, { ignore: '.sr-only' })).toBeVisible();
    unmount();

    setup({
      member: makeTeamMember({ profileUrl: '/team/jordan-reyes' }),
    });

    expect(screen.getByRole('link', { name: member.name })).toHaveAttribute(
      'href',
      '/team/jordan-reyes',
    );
  });

  it('renders the bio and social links only when the loader supplied them', () => {
    const { unmount } = setup();

    expect(
      screen.queryByText('Builds resilient distributed systems.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    unmount();

    setup({
      member: makeTeamMember({
        bio: [portableTextBlock('Builds resilient distributed systems.')],
        socialLinks: [
          {
            platform: SOCIAL_PLATFORMS.GITHUB,
            link: {
              label: 'GitHub',
              href: 'https://github.com/jreyes',
              target: '_blank',
              platform: undefined,
              ariaLabel: undefined,
            },
          },
        ],
      }),
    });

    expect(
      screen.getByText('Builds resilient distributed systems.'),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'GitHub profile' }),
    ).toHaveAttribute('href', 'https://github.com/jreyes');
  });
});
