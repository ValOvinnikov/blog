import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_CTA_ACTIONS,
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
} from '@web/testing/modules/cta/fixtures';
import {
  MOCK_TEAM_HEADING,
  MOCK_TEAM_MEMBERS,
  mockTeamMember,
} from '@web/testing/modules/team/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TeamModuleView } from './team-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(11);

const MOCK_TITLE_ID = faker.string.uuid();
const MOCK_DATA_TEST_ID = faker.string.uuid();
const CAROUSEL_LABEL = `${MOCK_TEAM_HEADING} carousel`;

const setup = customRender(TeamModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_TEAM_HEADING }),
  members: MOCK_TEAM_MEMBERS,
  showBios: false,
  showSocialLinks: false,
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.SQUARE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
});

describe(`<${TeamModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its h2 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_TEAM_HEADING,
      });
      const section = screen.getByRole('region', { name: MOCK_TEAM_HEADING });

      expect(heading).toBeVisible();
      expect(section).toBeVisible();
    });

    it('renders one article per member', () => {
      const articles = screen.getAllByRole('article');

      expect(articles).toHaveLength(MOCK_TEAM_MEMBERS.length);
    });

    it.each(MOCK_TEAM_MEMBERS.map(({ name }) => name))(
      'renders %s with an h3 name',
      (memberName) => {
        const heading = screen.getByRole('heading', {
          level: 3,
          name: memberName,
        });

        expect(heading).toBeVisible();
      },
    );

    it('renders two or more members without a spotlight', () => {
      const spotlight = screen.queryByTestId(`${MOCK_DATA_TEST_ID}-spotlight`);

      expect(spotlight).not.toBeInTheDocument();
    });

    it('renders no action group when there are no cta buttons', () => {
      const links = screen.queryAllByRole('link');

      expect(links).toHaveLength(0);
    });
  });

  it('renders the carousel in carousel mode', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    const carousel = screen.getByRole('region', { name: CAROUSEL_LABEL });
    const articles = within(carousel).getAllByRole('article');

    expect(articles).toHaveLength(MOCK_TEAM_MEMBERS.length);
  });

  it('renders no carousel in grid mode', () => {
    setup({ displayMode: DISPLAY_MODE.GRID });

    const carousel = screen.queryByRole('region', { name: CAROUSEL_LABEL });

    expect(carousel).not.toBeInTheDocument();
  });

  describe.each([DISPLAY_MODE.GRID, DISPLAY_MODE.CAROUSEL])(
    'a single member in %s display mode',
    (displayMode) => {
      const MOCK_MEMBER = mockTeamMember();

      beforeEach(() => {
        setup({ members: [MOCK_MEMBER], displayMode });
      });

      it('renders the member as a spotlight', () => {
        const spotlight = screen.getByTestId(`${MOCK_DATA_TEST_ID}-spotlight`);
        const heading = screen.getByRole('heading', {
          level: 3,
          name: MOCK_MEMBER.name,
        });

        expect(spotlight).toBeVisible();
        expect(heading).toBeVisible();
      });

      it('renders neither the carousel nor the grid', () => {
        const carousel = screen.queryByRole('region', {
          name: CAROUSEL_LABEL,
        });
        const grid = screen.queryByTestId(`${MOCK_DATA_TEST_ID}-grid`);

        expect(carousel).not.toBeInTheDocument();
        expect(grid).not.toBeInTheDocument();
      });
    },
  );

  it('renders the resolved cta buttons when present', () => {
    setup({ ctaButtons: MOCK_CTA_ACTIONS });

    const primaryLink = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });
    const secondaryLink = screen.getByRole('link', {
      name: MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
    });

    expect(primaryLink).toHaveAttribute(
      'href',
      MOCK_CTA_PRIMARY_ACTION.link.href,
    );
    expect(secondaryLink).toHaveAttribute(
      'href',
      MOCK_CTA_SECONDARY_ACTION.link.href,
    );
  });
});
