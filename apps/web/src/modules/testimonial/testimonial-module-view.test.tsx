import { faker } from '@faker-js/faker';
import {
  BRAND_VARIANT,
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
  MOCK_TESTIMONIAL_HEADING,
  MOCK_TESTIMONIAL_ITEMS,
  mockTestimonialItem,
} from '@web/testing/modules/testimonial/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockItemsWithIds } from '@web/testing/shared/items/fixtures';
import {
  MOCK_RADIUS_SCOPE_CASES,
  MOCK_SCOPED_RADIUS_TOKEN,
} from '@web/testing/shared/section-appearance/fixtures';

import { TestimonialModuleView } from './testimonial-module-view';

vi.mock('@web/i18n/navigation');
vi.mock('@shinefold/ui/components/organisms/carousel/use-carousel', () => ({
  useCarousel: () => ({ canScrollPrev: false, canScrollNext: false }),
}));

faker.seed(22);

const MOCK_TITLE_ID = faker.string.uuid();
const MOCK_DATA_TEST_ID = faker.string.uuid();
const CAROUSEL_LABEL = `${MOCK_TESTIMONIAL_HEADING} carousel`;
const DATA_ALIGNMENT = 'data-alignment';

const setup = customRender(TestimonialModuleView, {
  section: { brandVariant: BRAND_VARIANT.PRIMARY },
  headingBlock: mockHeadingBlock({ heading: MOCK_TESTIMONIAL_HEADING }),
  testimonials: MOCK_TESTIMONIAL_ITEMS,
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  columns: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
});

describe(`<${TestimonialModuleView.name}/>`, () => {
  describe('several testimonials in a grid with no actions', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its h2 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_TESTIMONIAL_HEADING,
      });
      const section = screen.getByRole('region', {
        name: MOCK_TESTIMONIAL_HEADING,
      });

      expect(heading).toBeVisible();
      expect(section).toBeVisible();
    });

    it('renders each testimonial as a blockquote', () => {
      const quotes = screen.getAllByRole('blockquote');

      expect(quotes).toHaveLength(MOCK_TESTIMONIAL_ITEMS.length);
    });

    it.each(MOCK_TESTIMONIAL_ITEMS.map(({ name }) => name))(
      'renders the name %s',
      (itemName) => {
        const name = screen.getByText(itemName, { ignore: '.sr-only' });

        expect(name).toBeVisible();
      },
    );

    it('renders no carousel', () => {
      const carousel = screen.queryByRole('region', { name: CAROUSEL_LABEL });

      expect(carousel).not.toBeInTheDocument();
    });

    it('renders no action group when there are no cta buttons', () => {
      const links = screen.queryAllByRole('link');

      expect(links).toHaveLength(0);
    });
  });

  it('renders a single testimonial as the spotlight, never the carousel', () => {
    setup({
      testimonials: [mockTestimonialItem()],
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const quotes = screen.getAllByRole('blockquote');
    const carousel = screen.queryByRole('region', { name: CAROUSEL_LABEL });

    expect(quotes).toHaveLength(1);
    expect(carousel).not.toBeInTheDocument();
  });

  it('renders several testimonials in a carousel in carousel mode', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    const carousel = screen.getByRole('region', { name: CAROUSEL_LABEL });
    const quotes = within(carousel).getAllByRole('blockquote');

    expect(quotes).toHaveLength(MOCK_TESTIMONIAL_ITEMS.length);
  });

  it.each([
    {
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
      expected: CONTENT_ALIGNMENT.CENTER,
    },
    {
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
      expected: CONTENT_ALIGNMENT.LEFT,
    },
    { contentAlignment: undefined, expected: CONTENT_ALIGNMENT.LEFT },
  ])(
    'aligns the carousel track $expected for content alignment $contentAlignment',
    ({ contentAlignment, expected }) => {
      setup({ displayMode: DISPLAY_MODE.CAROUSEL, contentAlignment });

      const carousel = screen.getByRole('region', { name: CAROUSEL_LABEL });

      expect(carousel).toHaveAttribute(DATA_ALIGNMENT, expected);
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

      const region = screen.getByRole('region', {
        name: MOCK_TESTIMONIAL_HEADING,
      });

      expect(region.style.getPropertyValue(MOCK_SCOPED_RADIUS_TOKEN)).toBe(
        scoped,
      );
    },
  );

  it.each([
    {
      title: 'in the stored column count over the quote count',
      columns: GRID_COLUMNS.FOUR,
      itemCount: 2,
      expected: 4,
    },
    {
      title: 'in columns that fit the quote count on Auto',
      columns: undefined,
      itemCount: 4,
      expected: 2,
    },
  ])('lays the grid out $title', ({ columns, itemCount, expected }) => {
    setup({
      columns,
      testimonials: mockItemsWithIds(itemCount, mockTestimonialItem),
    });

    const grid = screen.getByTestId(`${MOCK_DATA_TEST_ID}-grid-${expected}`);

    expect(grid).toBeVisible();
  });
});
