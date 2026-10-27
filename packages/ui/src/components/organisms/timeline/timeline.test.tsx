import {
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
  type TTimelineMarkerStyle,
} from '@blog/config';
import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Timeline, type TTimelineProps } from './timeline';

faker.seed(123);

const createItem = () => ({
  heading: faker.company.catchPhrase(),
  body: faker.lorem.sentence(),
});

const ARIA_HIDDEN = 'aria-hidden';
const MOCK_MARKER_LABEL = faker.lorem.word();
const MOCK_STRAY_TEXT = faker.lorem.words(3);
const firstItem = createItem();
const items = [firstItem, createItem(), createItem()];
const labelledMarker = `${MOCK_MARKER_LABEL} 1`;

const renderTimeline = (
  children: TTimelineProps['children'],
  markerStyle: TTimelineMarkerStyle = TIMELINE_MARKER_STYLE.NUMBERED,
) =>
  renderElement(
    <Timeline
      orientation={TIMELINE_ORIENTATION.VERTICAL}
      itemAlignment={CONTENT_ALIGNMENT.LEFT}
      markerStyle={markerStyle}
    >
      {children}
    </Timeline>,
  );

const renderItems = (markerStyle: TTimelineMarkerStyle) =>
  renderTimeline(
    items.map((item, index) => (
      <Timeline.Item key={item.heading}>
        <Timeline.Marker markerStyle={markerStyle}>
          {markerStyle === TIMELINE_MARKER_STYLE.NUMBERED
            ? index + 1
            : `${MOCK_MARKER_LABEL} ${index + 1}`}
        </Timeline.Marker>
        <Timeline.Heading>{item.heading}</Timeline.Heading>
        <Timeline.Body>
          <p>{item.body}</p>
        </Timeline.Body>
      </Timeline.Item>
    )),
    markerStyle,
  );

describe(`<${Timeline.name}/>`, () => {
  describe('with numbered markers', () => {
    beforeEach(() => {
      renderItems(TIMELINE_MARKER_STYLE.NUMBERED);
    });

    it('renders a list with one item per entry', () => {
      const list = screen.getByRole('list');
      const listItems = screen.getAllByRole('listitem');

      expect(list).toBeVisible();
      expect(listItems).toHaveLength(items.length);
    });

    it.each(items.map(({ heading }) => heading))(
      'renders the heading "%s" as a level-3 heading',
      (heading) => {
        const headingElement = screen.getByRole('heading', {
          level: 3,
          name: heading,
        });

        expect(headingElement).toBeVisible();
      },
    );

    it('hides a numbered marker from assistive tech', () => {
      const marker = screen.getByText('1');

      expect(marker).toHaveAttribute(ARIA_HIDDEN, 'true');
    });
  });

  it('does not hide a labelled marker from assistive tech', () => {
    renderItems(TIMELINE_MARKER_STYLE.LABELLED);

    const marker = screen.getByText(labelledMarker);

    expect(marker).not.toHaveAttribute(ARIA_HIDDEN);
  });

  it('renders unmatched children without dropping them', () => {
    renderTimeline(
      <Timeline.Item>
        <Timeline.Heading>{firstItem.heading}</Timeline.Heading>
        <span>{MOCK_STRAY_TEXT}</span>
      </Timeline.Item>,
      TIMELINE_MARKER_STYLE.LABELLED,
    );

    const stray = screen.getByText(MOCK_STRAY_TEXT);

    expect(stray).toBeVisible();
  });

  it('renders the heading before the body whatever order slots are written', () => {
    const { heading, body } = firstItem;
    renderTimeline(
      <Timeline.Item>
        <Timeline.Body>{body}</Timeline.Body>
        <Timeline.Heading>{heading}</Timeline.Heading>
        <Timeline.Marker markerStyle={TIMELINE_MARKER_STYLE.LABELLED}>
          {labelledMarker}
        </Timeline.Marker>
      </Timeline.Item>,
      TIMELINE_MARKER_STYLE.LABELLED,
    );

    const headingElement = screen.getByRole('heading', {
      level: 3,
      name: heading,
    });
    const bodyElement = screen.getByText(body);

    expect(headingElement.compareDocumentPosition(bodyElement)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
