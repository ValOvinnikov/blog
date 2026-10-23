import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
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
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { LogoWallModuleView } from './logo-wall-module-view';

const { LogoWallCarousel } = vi.hoisted(() => ({
  LogoWallCarousel: vi.fn(() => <div data-testid="logo-wall-carousel-stub" />),
}));

vi.mock('@web/i18n/navigation');

vi.mock('./components/logo-wall-carousel/logo-wall-carousel', () => ({
  LogoWallCarousel,
}));

const dataTestId = 'logo-wall-module-logo-wall-1';
const TITLE_ID = 'logo-wall-title';

const setup = customRender(LogoWallModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: MOCK_LOGO_WALL_HEADING }),
  logos: MOCK_LOGO_ITEMS,
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  layout: undefined,
  titleId: TITLE_ID,
  dataTestId,
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
      expect(heading).toHaveAttribute('id', TITLE_ID);
      expect(section).toHaveAttribute('aria-labelledby', TITLE_ID);
      expect(section).toHaveAttribute('data-testid', dataTestId);
    });

    it('renders every logo as an image named after the company', () => {
      MOCK_LOGO_ITEMS.forEach((logo) => {
        const logoImage = screen.getByRole('img', { name: logo.name });
        expect(logoImage).toBeVisible();
      });
      expect(LogoWallCarousel).not.toHaveBeenCalled();
    });

    it('renders no action group when there are no cta buttons', () => {
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });
  });

  it('renders the carousel in place of the row in carousel mode', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    expect(LogoWallCarousel).toHaveBeenCalledTimes(1);
    const carousel = screen.getByTestId('logo-wall-carousel-stub');
    const logoImage = screen.queryByRole('img');
    expect(carousel).toBeVisible();
    expect(logoImage).not.toBeInTheDocument();
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
