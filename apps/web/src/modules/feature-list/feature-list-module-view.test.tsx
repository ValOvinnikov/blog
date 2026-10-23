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
  MOCK_FEATURE_LIST_HEADING,
  MOCK_FEATURE_LIST_ITEMS,
} from '@web/testing/modules/feature-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import type { ReactElement } from 'react';

import type { IFeatureListCarouselProps } from './components/feature-list-carousel/feature-list-carousel';
import { FeatureListModuleView } from './feature-list-module-view';

const { FeatureListCarousel } = vi.hoisted(() => ({
  FeatureListCarousel: vi.fn<
    (props: IFeatureListCarouselProps) => ReactElement
  >(() => <div data-testid="feature-list-carousel-stub" />),
}));

vi.mock('@web/i18n/navigation');

vi.mock('./components/feature-list-carousel/feature-list-carousel', () => ({
  FeatureListCarousel,
}));

const TITLE_ID = 'feature-list-title';

const dataTestId = 'feature-list-module-feature-list-1';

const setup = customRender(FeatureListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: MOCK_FEATURE_LIST_HEADING }),
  items: MOCK_FEATURE_LIST_ITEMS,
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: TITLE_ID,
  dataTestId,
});

describe(`<${FeatureListModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its h2 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_FEATURE_LIST_HEADING,
      });
      const section = screen.getByRole('region', {
        name: MOCK_FEATURE_LIST_HEADING,
      });
      expect(heading).toHaveAttribute('id', TITLE_ID);
      expect(section).toHaveAttribute('aria-labelledby', TITLE_ID);
      expect(section).toHaveAttribute('data-testid', dataTestId);
    });

    it('renders one article with an h3 title per item', () => {
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
      MOCK_FEATURE_LIST_ITEMS.forEach((item) => {
        const heading = screen.getByRole('heading', {
          level: 3,
          name: item.headingBlock.heading,
        });
        expect(heading).toBeVisible();
      });
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

      expect(FeatureListCarousel).toHaveBeenCalledTimes(
        expectedCarousel ? 1 : 0,
      );
      if (expectedCarousel) {
        const carousel = screen.getByTestId('feature-list-carousel-stub');
        const article = screen.queryByRole('article');
        const { items } = FeatureListCarousel.mock.calls[0]![0];
        expect(carousel).toBeVisible();
        expect(items).toEqual(MOCK_FEATURE_LIST_ITEMS);
        expect(article).not.toBeInTheDocument();
      }
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
