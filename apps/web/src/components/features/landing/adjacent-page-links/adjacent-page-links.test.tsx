import { routes, SITE_MESSAGES } from '@shinefold/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  mockLandingAdjacentPages,
  MOCK_SECTION_PRICING_PATH,
  MOCK_SECTION_PRICING_TITLE,
  MOCK_SECTION_ROOT_PATH,
  MOCK_SECTION_ROOT_TITLE,
} from '@web/testing/pages/landing-page/fixtures';

import { AdjacentPageLinks } from './adjacent-page-links';

vi.mock('@web/i18n/navigation');

const NAV_NAME = SITE_MESSAGES.sectionNavigation.adjacentPages;
const { previous: PREVIOUS, next: NEXT } = SITE_MESSAGES.pagination;
const PREVIOUS_LINK_NAME = `${PREVIOUS} ${MOCK_SECTION_ROOT_TITLE}`;
const NEXT_LINK_NAME = `${NEXT} ${MOCK_SECTION_PRICING_TITLE}`;

const setup = customRender(AdjacentPageLinks, {
  adjacentPages: mockLandingAdjacentPages(),
});

describe(`<${AdjacentPageLinks.name}/>`, () => {
  describe('with both neighbours', () => {
    beforeEach(() => {
      setup();
    });

    it('puts the links in a named navigation landmark', () => {
      const nav = screen.getByRole('navigation', { name: NAV_NAME });

      expect(nav).toBeVisible();
    });

    it('links previous then next, each named with its direction and title', () => {
      const links = screen
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]);

      expect(links).toEqual([
        [PREVIOUS_LINK_NAME, routes.landingPage(MOCK_SECTION_ROOT_PATH)],
        [NEXT_LINK_NAME, routes.landingPage(MOCK_SECTION_PRICING_PATH)],
      ]);
    });
  });

  it.each([
    {
      name: 'the first page',
      adjacentPages: mockLandingAdjacentPages({ previous: undefined }),
      shown: NEXT_LINK_NAME,
      hidden: PREVIOUS_LINK_NAME,
    },
    {
      name: 'the last page',
      adjacentPages: mockLandingAdjacentPages({ next: undefined }),
      shown: PREVIOUS_LINK_NAME,
      hidden: NEXT_LINK_NAME,
    },
  ])('shows one link on $name', ({ adjacentPages, shown, hidden }) => {
    setup({ adjacentPages });

    const shownLink = screen.getByRole('link', { name: shown });
    const hiddenLink = screen.queryByRole('link', { name: hidden });

    expect(shownLink).toBeVisible();
    expect(hiddenLink).not.toBeInTheDocument();
  });
});
