import { BRAND_VARIANT, CARD_IMAGE_SHAPE } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makeTeamMember } from '@web/testing/modules/team/fixtures';

import { TeamCarousel } from './team-carousel';

vi.mock('@web/i18n/navigation');

const members = [
  makeTeamMember({ id: 'team-member-1', name: 'Jordan Reyes' }),
  makeTeamMember({ id: 'team-member-2', name: 'Casey Morgan' }),
];

const setup = customRender(TeamCarousel, {
  members,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  align: 'left',
  imageSizes: '100vw',
  title: 'Meet the team',
  tone: BRAND_VARIANT.PRIMARY,
});

describe(`<${TeamCarousel.name}/>`, () => {
  it('renders a labelled carousel with one card per member', async () => {
    setup();

    const region = screen.getByRole('region', {
      name: 'Meet the team carousel',
    });
    expect(within(region).getAllByRole('heading', { level: 3 })).toHaveLength(
      members.length,
    );
    members.forEach((member) => {
      expect(
        within(region).getByRole('heading', { level: 3, name: member.name }),
      ).toBeVisible();
    });
    expect(
      await screen.findByRole('button', { name: 'Previous slide' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeVisible();
  });
});
