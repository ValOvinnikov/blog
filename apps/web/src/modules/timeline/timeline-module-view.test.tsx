import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  TIMELINE_HORIZONTAL_ITEM_CAP,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_TIMELINE_HEADING,
  mockTimelineItem,
} from '@web/testing/modules/timeline/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TimelineModuleView } from './timeline-module-view';

faker.seed(21);

const MOCK_DATA_TEST_ID = faker.lorem.slug();
const MOCK_TITLE_ID = faker.lorem.slug();
const MOCK_ITEM_HEADING = faker.lorem.words(3);
const MOCK_MARKERS = faker.helpers.uniqueArray(faker.lorem.word, 8);
const MOCK_HEADINGS = faker.helpers.uniqueArray(
  () => faker.lorem.words(3),
  8,
);
const HORIZONTAL_TIMELINE_TEST_ID = `${MOCK_DATA_TEST_ID}-timeline-horizontal`;
const VERTICAL_TIMELINE_TEST_ID = `${MOCK_DATA_TEST_ID}-timeline-vertical`;
const DEFAULT_ITEM_COUNT = 3;

const mockTimelineItems = (count: number) =>
  MOCK_HEADINGS.slice(0, count).map((heading, index) =>
    mockTimelineItem({
      id: faker.string.uuid(),
      heading,
      marker: MOCK_MARKERS[index],
    }),
  );

const setup = customRender(TimelineModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_TIMELINE_HEADING }),
  markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
  items: mockTimelineItems(DEFAULT_ITEM_COUNT),
  orientation: TIMELINE_ORIENTATION.VERTICAL,
  ctaButtons: [],
  contentAlignment: undefined,
  itemAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
});

const setupHorizontal = (itemCount: number) =>
  setup({
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    items: mockTimelineItems(itemCount),
  });

describe(`<${TimelineModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the section heading as an h2 and each item heading as an h3', () => {
      const sectionHeading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_TIMELINE_HEADING,
      });
      const itemHeadings = screen.getAllByRole('heading', { level: 3 });

      expect(sectionHeading).toBeVisible();
      expect(itemHeadings).toHaveLength(DEFAULT_ITEM_COUNT);
    });

    it('renders the items in order as a list', () => {
      const list = screen.getByRole('list');
      const items = screen.getAllByRole('listitem');
      const headingNames = screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent);

      expect(list).toBeVisible();
      expect(items).toHaveLength(DEFAULT_ITEM_COUNT);
      expect(headingNames).toEqual(MOCK_HEADINGS.slice(0, DEFAULT_ITEM_COUNT));
    });

    it('numbers the markers by position when the marker style is numbered', () => {
      const firstMarker = screen.getByText('1');
      const secondMarker = screen.getByText('2');
      const thirdMarker = screen.getByText('3');
      const authoredMarkers = MOCK_MARKERS.slice(0, DEFAULT_ITEM_COUNT).map(
        (marker) => screen.queryByText(marker),
      );

      expect(firstMarker).toBeVisible();
      expect(secondMarker).toBeVisible();
      expect(thirdMarker).toBeVisible();
      for (const authoredMarker of authoredMarkers) {
        expect(authoredMarker).not.toBeInTheDocument();
      }
    });
  });

  it('shows the authored marker when the marker style is labelled', () => {
    setup({ markerStyle: TIMELINE_MARKER_STYLE.LABELLED });

    const authoredMarkers = MOCK_MARKERS.slice(0, DEFAULT_ITEM_COUNT).map(
      (marker) => screen.getByText(marker),
    );
    const numberedMarker = screen.queryByText('1');

    expect(authoredMarkers).toHaveLength(DEFAULT_ITEM_COUNT);
    expect(numberedMarker).not.toBeInTheDocument();
    for (const authoredMarker of authoredMarkers) {
      expect(authoredMarker).toBeVisible();
    }
  });

  it('renders an item without a body', () => {
    setup({
      items: [mockTimelineItem({ heading: MOCK_ITEM_HEADING, body: undefined })],
    });

    const heading = screen.getByRole('heading', { name: MOCK_ITEM_HEADING });

    expect(heading).toBeVisible();
  });

  it('keeps a horizontal timeline horizontal at the item cap', () => {
    setupHorizontal(TIMELINE_HORIZONTAL_ITEM_CAP);

    const horizontalTimeline = screen.getByTestId(HORIZONTAL_TIMELINE_TEST_ID);
    const items = screen.getAllByRole('listitem');

    expect(horizontalTimeline).toBeVisible();
    expect(items).toHaveLength(TIMELINE_HORIZONTAL_ITEM_CAP);
  });

  it('renders a horizontal timeline over the cap vertically with every item', () => {
    const overCapCount = TIMELINE_HORIZONTAL_ITEM_CAP + 1;
    setupHorizontal(overCapCount);

    const verticalTimeline = screen.getByTestId(VERTICAL_TIMELINE_TEST_ID);
    const horizontalTimeline = screen.queryByTestId(
      HORIZONTAL_TIMELINE_TEST_ID,
    );
    const items = screen.getAllByRole('listitem');

    expect(verticalTimeline).toBeVisible();
    expect(horizontalTimeline).not.toBeInTheDocument();
    expect(items).toHaveLength(overCapCount);
  });
});
