import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
  MOCK_CTA_ACTIONS,
} from '@web/testing/modules/cta/fixtures';
import {
  MOCK_LOGO_ITEMS,
  MOCK_LOGO_WALL_HEADING,
} from '@web/testing/modules/logo-wall/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { LogoWallModuleView } from './logo-wall-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_DATA_TEST_ID = faker.string.uuid();
const MOCK_TITLE_ID = faker.string.uuid();
const CAROUSEL_LABEL = `${MOCK_LOGO_WALL_HEADING} carousel`;

const setup = customRender(LogoWallModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_LOGO_WALL_HEADING }),
  logos: MOCK_LOGO_ITEMS,
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  layout: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
});

describe(`<${LogoWallModuleView.name}/>`, () => {
  describe('two logos in a wrapping row with no actions', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its h2 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_LOGO_WALL_HEADING,
      });
      const section = screen.getByRole('region', {
        name: MOCK_LOGO_WALL_HEADING,
      });

      expect(heading).toHaveAttribute('id', MOCK_TITLE_ID);
      expect(section).toHaveAttribute('aria-labelledby', MOCK_TITLE_ID);
    });

    it('renders every logo as an image named after the company', () => {
      MOCK_LOGO_ITEMS.forEach((logo) => {
        const logoImage = screen.getByRole('img', { name: logo.name });
        expect(logoImage).toBeVisible();
      });
    });

    it('renders no carousel', () => {
      const carousel = screen.queryByRole('region', { name: CAROUSEL_LABEL });

      expect(carousel).not.toBeInTheDocument();
    });

    it('renders no action group when there are no cta buttons', () => {
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });
  });

  it('renders the carousel in place of the row in carousel mode', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    const carousel = screen.getByRole('region', { name: CAROUSEL_LABEL });

    expect(carousel).toBeVisible();
  });

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
