import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
  MOCK_CTA_ACTIONS,
} from '@web/testing/modules/cta/fixtures';
import {
  MOCK_TEAM_HEADING,
  MOCK_TEAM_MEMBERS,
  mockTeamMember,
} from '@web/testing/modules/team/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TeamModuleView } from './team-module-view';

vi.mock('@web/i18n/navigation');

const TITLE_ID = 'team-title';
const CAROUSEL_LABEL = `${MOCK_TEAM_HEADING} carousel`;

const dataTestId = 'team-module-team-1';

const setup = customRender(TeamModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: MOCK_TEAM_HEADING }),
  members: MOCK_TEAM_MEMBERS,
  showBios: false,
  showSocialLinks: false,
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.SQUARE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: TITLE_ID,
  dataTestId,
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
      expect(heading).toHaveAttribute('id', TITLE_ID);
      expect(section).toHaveAttribute('aria-labelledby', TITLE_ID);
      expect(section).toHaveAttribute('data-testid', dataTestId);
    });

    it('renders one article with an h3 name per member', () => {
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
      MOCK_TEAM_MEMBERS.forEach((member) => {
        const heading = screen.getByRole('heading', {
          level: 3,
          name: member.name,
        });
        expect(heading).toBeVisible();
      });
    });

    it('renders two or more members without a spotlight', () => {
      const spotlight = screen.queryByTestId(`${dataTestId}-spotlight`);
      expect(spotlight).not.toBeInTheDocument();
    });

    it('renders no action group when there are no cta buttons', () => {
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });
  });

  it.each([
    [DISPLAY_MODE.CAROUSEL, true],
    [DISPLAY_MODE.GRID, false],
  ])(
    'renders the carousel in place of the grid only in %s mode: %s',
    (displayMode, expectedCarousel) => {
      setup({ displayMode });

      if (expectedCarousel) {
        const carousel = screen.getByRole('region', { name: CAROUSEL_LABEL });
        const articles = within(carousel).getAllByRole('article');
        expect(articles).toHaveLength(MOCK_TEAM_MEMBERS.length);
      } else {
        const carousel = screen.queryByRole('region', {
          name: CAROUSEL_LABEL,
        });
        expect(carousel).not.toBeInTheDocument();
      }
    },
  );

  it.each([DISPLAY_MODE.GRID, DISPLAY_MODE.CAROUSEL])(
    'renders a single member as a spotlight in %s display mode',
    (displayMode) => {
      setup({ members: [mockTeamMember()], displayMode });

      const spotlight = screen.getByTestId(`${dataTestId}-spotlight`);
      const heading = screen.getByRole('heading', {
        level: 3,
        name: 'Jordan Reyes',
      });
      const carousel = screen.queryByRole('region', {
        name: CAROUSEL_LABEL,
      });
      const grid = screen.queryByTestId(`${dataTestId}-grid`);
      expect(spotlight).toBeVisible();
      expect(heading).toBeVisible();
      expect(carousel).not.toBeInTheDocument();
      expect(grid).not.toBeInTheDocument();
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
