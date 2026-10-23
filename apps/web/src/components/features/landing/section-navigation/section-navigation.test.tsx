import { customRender, screen } from '@web/testing/custom-render';
import {
  mockLandingSectionNavigation,
  MOCK_SECTION_FAQ_PATH,
  MOCK_SECTION_FAQ_TITLE,
  MOCK_SECTION_PRICING_PATH,
  MOCK_SECTION_PRICING_TITLE,
  MOCK_SECTION_ROOT_PATH,
  MOCK_SECTION_ROOT_TITLE,
} from '@web/testing/pages/landing-page/fixtures';

import { SectionNavigation } from './section-navigation';

vi.mock('@web/i18n/navigation');

const ARIA_CURRENT = 'aria-current';
const NAV_NAME = 'In this section';
const AUTHORED_TITLE = 'Guides';
const PARENT_TITLE = 'Library';
const BACK_LINK_NAME = `Back to ${PARENT_TITLE}`;

const setup = customRender(SectionNavigation, {
  sectionNavigation: mockLandingSectionNavigation(),
});

describe(`<${SectionNavigation.name}/>`, () => {
  describe('on a page beneath the section root', () => {
    beforeEach(() => {
      setup();
    });

    it('renders an "In this section" nav landmark', () => {
      const nav = screen.getByRole('navigation', { name: NAV_NAME });

      expect(nav).toBeVisible();
    });

    it('links the section root first, then its pages in the given order', () => {
      const links = screen
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]);

      expect(links).toEqual([
        [MOCK_SECTION_ROOT_TITLE, `/${MOCK_SECTION_ROOT_PATH}`],
        [MOCK_SECTION_FAQ_TITLE, `/${MOCK_SECTION_FAQ_PATH}`],
        [MOCK_SECTION_PRICING_TITLE, `/${MOCK_SECTION_PRICING_PATH}`],
      ]);
    });

    it('marks the current page with aria-current="page", and no other', () => {
      const currentLink = screen.getByRole('link', {
        name: MOCK_SECTION_FAQ_TITLE,
      });
      const rootLink = screen.getByRole('link', {
        name: MOCK_SECTION_ROOT_TITLE,
      });
      const pricingLink = screen.getByRole('link', {
        name: MOCK_SECTION_PRICING_TITLE,
      });

      expect(currentLink).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(rootLink).not.toHaveAttribute(ARIA_CURRENT);
      expect(pricingLink).not.toHaveAttribute(ARIA_CURRENT);
    });
  });

  describe('on the section root', () => {
    beforeEach(() => {
      setup({
        sectionNavigation: mockLandingSectionNavigation({
          root: {
            title: MOCK_SECTION_ROOT_TITLE,
            path: MOCK_SECTION_ROOT_PATH,
            isCurrent: true,
          },
          pages: [
            {
              title: MOCK_SECTION_FAQ_TITLE,
              path: MOCK_SECTION_FAQ_PATH,
              isCurrent: false,
            },
          ],
        }),
      });
    });

    it('marks the section root as the current page', () => {
      const rootLink = screen.getByRole('link', {
        name: MOCK_SECTION_ROOT_TITLE,
      });

      expect(rootLink).toHaveAttribute(ARIA_CURRENT, 'page');
    });

    it('shows the section root in the mobile selector', () => {
      const selector = screen.getByRole('button', {
        name: `${NAV_NAME} ${MOCK_SECTION_ROOT_TITLE}`,
      });

      expect(selector).toBeVisible();
    });
  });

  describe('with an authored section title', () => {
    beforeEach(() => {
      setup({
        sectionNavigation: mockLandingSectionNavigation({
          title: AUTHORED_TITLE,
        }),
      });
    });

    it('names the nav landmark with the authored title', () => {
      const nav = screen.getByRole('navigation', { name: AUTHORED_TITLE });

      expect(nav).toBeVisible();
    });

    it('does not fall back to "In this section"', () => {
      const defaultNav = screen.queryByRole('navigation', { name: NAV_NAME });

      expect(defaultNav).not.toBeInTheDocument();
    });
  });

  describe('in a section nested inside another section', () => {
    beforeEach(() => {
      setup({
        sectionNavigation: mockLandingSectionNavigation({
          parentSection: { title: PARENT_TITLE, path: 'library' },
        }),
      });
    });

    it('starts with a back link to the parent section', () => {
      const backLink = screen.getByRole('link', { name: BACK_LINK_NAME });

      expect(screen.getAllByRole('link').at(0)).toBe(backLink);
    });

    it("points the back link at the parent section's path", () => {
      const backLink = screen.getByRole('link', { name: BACK_LINK_NAME });

      expect(backLink).toHaveAttribute('href', '/library');
    });
  });

  describe('in a top-level section', () => {
    beforeEach(() => {
      setup();
    });

    it('renders no back link', () => {
      const backLink = screen.queryByRole('link', { name: /^Back to/ });

      expect(backLink).not.toBeInTheDocument();
    });
  });
});
