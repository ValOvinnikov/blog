import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeTimelineItem } from '@web/testing/modules/timeline/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TimelineModuleView } from './timeline-module-view';

const makeItems = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    makeTimelineItem({
      id: `item-${index + 1}`,
      heading: `Step heading ${index + 1}`,
      marker: `Year ${2020 + index}`,
    }),
  );

const setup = customRender(TimelineModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'How we work' }),
  markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
  items: makeItems(3),
  orientation: TIMELINE_ORIENTATION.VERTICAL,
  ctaButtons: [],
  contentAlignment: undefined,
  itemAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: 'timeline-title',
  dataTestId: 'timeline-module-1',
});

describe(`<${TimelineModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the section heading as an h2 and each item heading as an h3', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'How we work' }),
      ).toBeVisible();
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    });

    it('renders the items in order as a list', () => {
      const headings = screen.getAllByRole('heading', { level: 3 });

      expect(screen.getByRole('list')).toBeVisible();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(headings[0]).toHaveAccessibleName('Step heading 1');
      expect(headings[1]).toHaveAccessibleName('Step heading 2');
      expect(headings[2]).toHaveAccessibleName('Step heading 3');
    });

    it('numbers the markers by position when the marker style is numbered', () => {
      expect(screen.getByText('1')).toBeVisible();
      expect(screen.getByText('2')).toBeVisible();
      expect(screen.getByText('3')).toBeVisible();
      expect(screen.queryByText('Year 2020')).not.toBeInTheDocument();
    });
  });

  it('shows the authored marker when the marker style is labelled', () => {
    setup({ markerStyle: TIMELINE_MARKER_STYLE.LABELLED });

    expect(screen.getByText('Year 2020')).toBeVisible();
    expect(screen.getByText('Year 2021')).toBeVisible();
    expect(screen.getByText('Year 2022')).toBeVisible();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('renders an item without a body', () => {
    setup({ items: [makeTimelineItem({ body: undefined })] });

    expect(screen.getByRole('heading', { name: 'Discovery' })).toBeVisible();
  });

  it('keeps a horizontal timeline horizontal at the item cap', () => {
    setup({
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      items: makeItems(5),
    });

    expect(
      screen.getByTestId('timeline-module-1-timeline-horizontal'),
    ).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('renders a horizontal timeline over the cap vertically with every item', () => {
    setup({
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      items: makeItems(6),
    });

    expect(
      screen.getByTestId('timeline-module-1-timeline-vertical'),
    ).toBeVisible();
    expect(
      screen.queryByTestId('timeline-module-1-timeline-horizontal'),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('Step heading 6')).toBeVisible();
  });
});
