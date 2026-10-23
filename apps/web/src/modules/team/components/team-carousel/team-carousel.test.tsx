import { BRAND_VARIANT, CARD_IMAGE_SHAPE } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_TEAM_HEADING,
  MOCK_TEAM_MEMBERS,
} from '@web/testing/modules/team/fixtures';

import { TeamCarousel } from './team-carousel';

vi.mock('@web/i18n/navigation');

const setup = customRender(TeamCarousel, {
  members: MOCK_TEAM_MEMBERS,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  align: 'left',
  title: MOCK_TEAM_HEADING,
  tone: BRAND_VARIANT.PRIMARY,
});

describe(`<${TeamCarousel.name}/>`, () => {
  it('renders a labelled carousel with one card per member', async () => {
    setup();

    const region = screen.getByRole('region', {
      name: `${MOCK_TEAM_HEADING} carousel`,
    });
    const cardHeadings = within(region).getAllByRole('heading', { level: 3 });
    expect(cardHeadings).toHaveLength(MOCK_TEAM_MEMBERS.length);
    MOCK_TEAM_MEMBERS.forEach((member) => {
      const cardHeading = within(region).getByRole('heading', {
        level: 3,
        name: member.name,
      });
      expect(cardHeading).toBeVisible();
    });
    const previousButton = await screen.findByRole('button', {
      name: 'Previous slide',
    });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });
    expect(previousButton).toBeVisible();
    expect(nextButton).toBeVisible();
  });
});
