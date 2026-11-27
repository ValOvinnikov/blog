import { CARD_IMAGE_SHAPE } from '@shinefold/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_TEAM_HEADING,
  MOCK_TEAM_MEMBERS,
} from '@web/testing/modules/team/fixtures';

import { TeamCarousel } from './team-carousel';

const CAROUSEL_LABEL = `${MOCK_TEAM_HEADING} carousel`;

const setup = customRender(TeamCarousel, {
  members: MOCK_TEAM_MEMBERS,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  align: 'left',
  title: MOCK_TEAM_HEADING,
});

describe(`<${TeamCarousel.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it.each(MOCK_TEAM_MEMBERS.map(({ name }) => name))(
    'renders %s as a card in the labelled carousel',
    (memberName) => {
      const region = screen.getByRole('region', { name: CAROUSEL_LABEL });
      const cardHeading = within(region).getByRole('heading', {
        level: 3,
        name: memberName,
      });

      expect(cardHeading).toBeVisible();
    },
  );

  it('renders exactly one card per member', () => {
    const region = screen.getByRole('region', { name: CAROUSEL_LABEL });
    const cardHeadings = within(region).getAllByRole('heading', { level: 3 });

    expect(cardHeadings).toHaveLength(MOCK_TEAM_MEMBERS.length);
  });
});
