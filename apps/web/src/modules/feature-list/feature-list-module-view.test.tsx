import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen, within } from '@web/testing/custom-render';
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
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { FeatureListModuleView } from './feature-list-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_TITLE_ID = faker.string.uuid();
const MOCK_DATA_TEST_ID = faker.string.uuid();
const CAROUSEL_LABEL = `${MOCK_FEATURE_LIST_HEADING} carousel`;

const setup = customRender(FeatureListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_FEATURE_LIST_HEADING }),
  items: MOCK_FEATURE_LIST_ITEMS,
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
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

      expect(heading).toHaveAttribute('id', MOCK_TITLE_ID);
      expect(section).toHaveAttribute('aria-labelledby', MOCK_TITLE_ID);
    });

    it('renders one article with an h3 title per item', () => {
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(MOCK_FEATURE_LIST_ITEMS.length);
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

  it('renders the items in a labelled carousel in carousel mode', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    const carousel = screen.getByRole('region', { name: CAROUSEL_LABEL });
    const articles = within(carousel).getAllByRole('article');

    expect(articles).toHaveLength(MOCK_FEATURE_LIST_ITEMS.length);
  });

  it('renders no carousel in grid mode', () => {
    setup({ displayMode: DISPLAY_MODE.GRID });

    const carousel = screen.queryByRole('region', { name: CAROUSEL_LABEL });

    expect(carousel).not.toBeInTheDocument();
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
