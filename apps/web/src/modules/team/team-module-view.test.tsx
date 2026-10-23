import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
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
import type { ReactElement } from 'react';

import type { ITeamCarouselProps } from './components/team-carousel/team-carousel';
import { TeamModuleView } from './team-module-view';

const { TeamCarousel } = vi.hoisted(() => ({
  TeamCarousel: vi.fn<(props: ITeamCarouselProps) => ReactElement>(() => (
    <div data-testid="team-carousel-stub" />
  )),
}));

vi.mock('@web/i18n/navigation');

vi.mock('./components/team-carousel/team-carousel', () => ({ TeamCarousel }));

const TITLE_ID = 'team-title';

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

      expect(TeamCarousel).toHaveBeenCalledTimes(expectedCarousel ? 1 : 0);
      if (expectedCarousel) {
        const carousel = screen.getByTestId('team-carousel-stub');
        const article = screen.queryByRole('article');
        const { members } = TeamCarousel.mock.calls[0]![0];
        expect(carousel).toBeVisible();
        expect(members).toEqual(MOCK_TEAM_MEMBERS);
        expect(article).not.toBeInTheDocument();
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
      const grid = screen.queryByTestId(`${dataTestId}-grid`);
      expect(spotlight).toBeVisible();
      expect(heading).toBeVisible();
      expect(TeamCarousel).not.toHaveBeenCalled();
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
