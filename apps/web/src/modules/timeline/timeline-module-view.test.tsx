import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_TIMELINE_HEADING,
  mockTimelineItem,
} from '@web/testing/modules/timeline/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TimelineModuleView } from './timeline-module-view';

const HORIZONTAL_TIMELINE_TEST_ID = 'timeline-module-1-timeline-horizontal';

const mockTimelineItems = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    mockTimelineItem({
      id: `item-${index + 1}`,
      heading: `Step heading ${index + 1}`,
      marker: `Year ${2020 + index}`,
    }),
  );

const setup = customRender(TimelineModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_TIMELINE_HEADING }),
  markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
  items: mockTimelineItems(3),
  orientation: TIMELINE_ORIENTATION.VERTICAL,
  ctaButtons: [],
  contentAlignment: undefined,
  itemAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: 'timeline-title',
  dataTestId: 'timeline-module-1',
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
      expect(itemHeadings).toHaveLength(3);
    });

    it('renders the items in order as a list', () => {
      const headings = screen.getAllByRole('heading', { level: 3 });

      const list = screen.getByRole('list');
      const items = screen.getAllByRole('listitem');
      expect(list).toBeVisible();
      expect(items).toHaveLength(3);
      expect(headings[0]).toHaveAccessibleName('Step heading 1');
      expect(headings[1]).toHaveAccessibleName('Step heading 2');
      expect(headings[2]).toHaveAccessibleName('Step heading 3');
    });

    it('numbers the markers by position when the marker style is numbered', () => {
      const firstMarker = screen.getByText('1');
      const secondMarker = screen.getByText('2');
      const thirdMarker = screen.getByText('3');
      const authoredMarker = screen.queryByText('Year 2020');
      expect(firstMarker).toBeVisible();
      expect(secondMarker).toBeVisible();
      expect(thirdMarker).toBeVisible();
      expect(authoredMarker).not.toBeInTheDocument();
    });
  });

  it('shows the authored marker when the marker style is labelled', () => {
    setup({ markerStyle: TIMELINE_MARKER_STYLE.LABELLED });

    const firstMarker = screen.getByText('Year 2020');
    const secondMarker = screen.getByText('Year 2021');
    const thirdMarker = screen.getByText('Year 2022');
    const numberedMarker = screen.queryByText('1');
    expect(firstMarker).toBeVisible();
    expect(secondMarker).toBeVisible();
    expect(thirdMarker).toBeVisible();
    expect(numberedMarker).not.toBeInTheDocument();
  });

  it('renders an item without a body', () => {
    setup({ items: [mockTimelineItem({ body: undefined })] });

    const heading = screen.getByRole('heading', { name: 'Discovery' });
    expect(heading).toBeVisible();
  });

  it('keeps a horizontal timeline horizontal at the item cap', () => {
    setupHorizontal(5);

    const horizontalTimeline = screen.getByTestId(HORIZONTAL_TIMELINE_TEST_ID);
    const items = screen.getAllByRole('listitem');
    expect(horizontalTimeline).toBeVisible();
    expect(items).toHaveLength(5);
  });

  it('renders a horizontal timeline over the cap vertically with every item', () => {
    setupHorizontal(6);

    const verticalTimeline = screen.getByTestId(
      'timeline-module-1-timeline-vertical',
    );
    const horizontalTimeline = screen.queryByTestId(
      HORIZONTAL_TIMELINE_TEST_ID,
    );
    const items = screen.getAllByRole('listitem');
    const lastHeading = screen.getByText('Step heading 6');
    expect(verticalTimeline).toBeVisible();
    expect(horizontalTimeline).not.toBeInTheDocument();
    expect(items).toHaveLength(6);
    expect(lastHeading).toBeVisible();
  });
});
