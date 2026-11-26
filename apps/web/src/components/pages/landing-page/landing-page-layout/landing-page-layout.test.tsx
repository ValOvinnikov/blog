import { faker } from '@faker-js/faker';
import { SITE_MESSAGES } from '@shinefold/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  mockLandingAdjacentPages,
  mockLandingSectionNavigation,
} from '@web/testing/pages/landing-page/fixtures';

import { LandingPageLayout } from './landing-page-layout';

vi.mock('@web/i18n/navigation');

faker.seed(8107);

const SECTION_NAV_NAME = SITE_MESSAGES.sectionNavigation.label;
const ADJACENT_PAGES_NAME = SITE_MESSAGES.sectionNavigation.adjacentPages;
const MOCK_CONTENT = faker.lorem.sentence();

const setup = customRender(LandingPageLayout, {
  topBlock: null,
  children: MOCK_CONTENT,
});

describe(`<${LandingPageLayout.name}/>`, () => {
  describe('outside a section', () => {
    beforeEach(() => {
      setup({ navigation: { adjacentPages: mockLandingAdjacentPages() } });
    });

    it('renders the content', () => {
      const content = screen.getByText(MOCK_CONTENT);

      expect(content).toBeVisible();
    });

    it('renders neither the section navigation nor the previous and next links', () => {
      const sectionNav = screen.queryByRole('navigation', {
        name: SECTION_NAV_NAME,
      });
      const adjacentNav = screen.queryByRole('navigation', {
        name: ADJACENT_PAGES_NAME,
      });

      expect(sectionNav).not.toBeInTheDocument();
      expect(adjacentNav).not.toBeInTheDocument();
    });
  });

  it('renders the section navigation and the previous and next links inside a section', () => {
    setup({
      navigation: {
        sectionNavigation: mockLandingSectionNavigation(),
        adjacentPages: mockLandingAdjacentPages(),
      },
    });

    const sectionNav = screen.getByRole('navigation', {
      name: SECTION_NAV_NAME,
    });
    const adjacentNav = screen.getByRole('navigation', {
      name: ADJACENT_PAGES_NAME,
    });

    expect(sectionNav).toBeVisible();
    expect(adjacentNav).toBeVisible();
  });

  it('renders no previous and next links in a section without neighbours', () => {
    setup({
      navigation: { sectionNavigation: mockLandingSectionNavigation() },
    });

    const adjacentNav = screen.queryByRole('navigation', {
      name: ADJACENT_PAGES_NAME,
    });

    expect(adjacentNav).not.toBeInTheDocument();
  });
});
