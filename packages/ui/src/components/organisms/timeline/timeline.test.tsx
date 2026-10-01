import {
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
  type TTimelineMarkerStyle,
} from '@blog/config';
import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Timeline } from './timeline';

faker.seed(123);

const createItem = () => ({
  heading: faker.company.catchPhrase(),
  body: faker.lorem.sentence(),
});

const firstItem = createItem();
const items = [firstItem, createItem(), createItem()];

const renderTimeline = (
  markerStyle: TTimelineMarkerStyle = TIMELINE_MARKER_STYLE.NUMBERED,
) =>
  renderElement(
    <Timeline
      orientation={TIMELINE_ORIENTATION.VERTICAL}
      itemAlignment={CONTENT_ALIGNMENT.LEFT}
      markerStyle={markerStyle}
    >
      {items.map((item, index) => (
        <Timeline.Item key={item.heading}>
          <Timeline.Marker markerStyle={markerStyle}>
            {markerStyle === TIMELINE_MARKER_STYLE.NUMBERED
              ? index + 1
              : `Step ${index + 1}`}
          </Timeline.Marker>
          <Timeline.Heading>{item.heading}</Timeline.Heading>
          <Timeline.Body>
            <p>{item.body}</p>
          </Timeline.Body>
        </Timeline.Item>
      ))}
    </Timeline>,
  );

describe(`<${Timeline.name}/>`, () => {
  it('renders an ordered list with one item per entry', () => {
    renderTimeline();

    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(items.length);
  });

  it('renders each item heading as a level-3 heading', () => {
    renderTimeline();

    for (const item of items) {
      expect(
        screen.getByRole('heading', { level: 3, name: item.heading }),
      ).toBeVisible();
    }
  });

  it('hides a numbered marker from assistive tech, since the list already conveys the count', () => {
    renderTimeline();

    expect(screen.getByText('1')).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not hide a labelled marker from assistive tech', () => {
    renderTimeline(TIMELINE_MARKER_STYLE.LABELLED);

    expect(screen.getByText('Step 1')).not.toHaveAttribute('aria-hidden');
  });

  it('renders the heading before the body whatever order the slots are written in', () => {
    const { heading, body } = firstItem;
    renderElement(
      <Timeline
        orientation={TIMELINE_ORIENTATION.VERTICAL}
        itemAlignment={CONTENT_ALIGNMENT.LEFT}
        markerStyle={TIMELINE_MARKER_STYLE.LABELLED}
      >
        <Timeline.Item>
          <Timeline.Body>{body}</Timeline.Body>
          <Timeline.Heading>{heading}</Timeline.Heading>
          <Timeline.Marker markerStyle={TIMELINE_MARKER_STYLE.LABELLED}>
            Step 1
          </Timeline.Marker>
        </Timeline.Item>
      </Timeline>,
    );

    const headingNode = screen.getByRole('heading', {
      level: 3,
      name: heading,
    });
    expect(
      headingNode.compareDocumentPosition(screen.getByText(body)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
