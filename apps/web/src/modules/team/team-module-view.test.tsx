import { faker } from '@faker-js/faker';
import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  GRID_COLUMNS,
} from '@shinefold/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_CTA_ACTIONS,
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
} from '@web/testing/modules/cta/fixtures';
import {
  MOCK_TEAM_HEADING,
  MOCK_TEAM_MEMBERS,
  mockTeamMember,
} from '@web/testing/modules/team/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockItemsWithIds } from '@web/testing/shared/items/fixtures';
import {
  MOCK_RADIUS_SCOPE_CASES,
  MOCK_SCOPED_RADIUS_TOKEN,
} from '@web/testing/shared/section-appearance/fixtures';

import { TeamModuleView } from './team-module-view';

faker.seed(11);

const MOCK_MODULE_ID = faker.string.uuid();
const MOCK_DATA_TEST_ID = `team-module-${MOCK_MODULE_ID}`;
const CAROUSEL_LABEL = `${MOCK_TEAM_HEADING} carousel`;
const MOCK_GRID_TEST_ID = new RegExp(`^${MOCK_DATA_TEST_ID}-grid`);

const setup = customRender(TeamModuleView, {
  section: { brandVariant: BRAND_VARIANT.PRIMARY },
  headingBlock: mockHeadingBlock({ heading: MOCK_TEAM_HEADING }),
  members: MOCK_TEAM_MEMBERS,
  displayMode: DISPLAY_MODE.GRID,
  ctaButtons: [],
  contentAlignment: undefined,
  card: {
    imageShape: CARD_IMAGE_SHAPE.SQUARE,
    cardAlignment: CONTENT_ALIGNMENT.LEFT,
  },
  grid: { columns: undefined, showBios: false },
  id: MOCK_MODULE_ID,
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
        const grid = screen.queryByTestId(MOCK_GRID_TEST_ID);

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
      name: MOCK_CTA_SECONDARY_ACTION.link.label,
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

  it.each(MOCK_RADIUS_SCOPE_CASES)(
    'scopes the radius token to its section $title an override',
    ({ section, scoped }) => {
      setup({ section });

      const region = screen.getByRole('region', { name: MOCK_TEAM_HEADING });

      expect(region.style.getPropertyValue(MOCK_SCOPED_RADIUS_TOKEN)).toBe(
        scoped,
      );
    },
  );

  it.each([
    {
      title: 'in the stored column count over the member count',
      columns: GRID_COLUMNS.TWO,
      showBios: false,
      memberCount: 3,
      expected: 2,
    },
    {
      title: 'in a stored column count past three with bios shown',
      columns: GRID_COLUMNS.FOUR,
      showBios: true,
      memberCount: 4,
      expected: 4,
    },
    {
      title: 'in at most three columns on Auto with bios shown',
      columns: undefined,
      showBios: true,
      memberCount: 4,
      expected: 3,
    },
  ])(
    'lays the grid out $title',
    ({ columns, showBios, memberCount, expected }) => {
      setup({
        grid: { columns, showBios },
        members: mockItemsWithIds(memberCount, mockTeamMember),
      });

      const grid = screen.getByTestId(`${MOCK_DATA_TEST_ID}-grid-${expected}`);

      expect(grid).toBeVisible();
    },
  );

  it('ignores a stored column count in carousel mode', () => {
    setup({
      displayMode: DISPLAY_MODE.CAROUSEL,
      grid: { columns: GRID_COLUMNS.TWO, showBios: false },
    });

    const grid = screen.queryByTestId(MOCK_GRID_TEST_ID);

    expect(grid).not.toBeInTheDocument();
  });
});
