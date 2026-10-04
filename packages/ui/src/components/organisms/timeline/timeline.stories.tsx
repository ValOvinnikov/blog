import {
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
  type TContentAlignment,
  type TTimelineMarkerStyle,
  type TTimelineOrientation,
} from '@blog/config';
import { objectKeys } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Timeline } from './timeline';
import { timelineVariants } from './timeline-variants';

const numberedItems = Array.from({ length: 3 }, () => ({
  heading: faker.company.catchPhrase(),
  body: faker.lorem.sentence(),
}));

const labelledItems = Array.from({ length: 3 }, () => ({
  marker: faker.date.past({ years: 8 }).getFullYear().toString(),
  heading: faker.company.catchPhrase(),
  body: faker.lorem.sentence(),
}));

const fourItems = Array.from({ length: 4 }, () => ({
  heading: faker.company.catchPhrase(),
  body: faker.lorem.sentence(),
}));

const longTextItems = [
  ...Array.from({ length: 2 }, () => ({
    heading: faker.company.catchPhrase(),
    body: faker.lorem.sentence(),
  })),
  { heading: faker.company.catchPhrase(), body: faker.lorem.paragraphs(2) },
];

type TTimelineStoryItem = { marker?: string; heading: string; body: string };

const renderTimelineItems = (
  items: TTimelineStoryItem[],
  options: {
    markerStyle: TTimelineMarkerStyle;
    orientation?: TTimelineOrientation;
    itemAlignment?: Extract<TContentAlignment, 'LEFT' | 'CENTER'>;
  },
) =>
  items.map(({ marker, heading, body }, index) => (
    <Timeline.Item
      key={heading}
      orientation={options.orientation}
      itemAlignment={options.itemAlignment}
    >
      <Timeline.Marker markerStyle={options.markerStyle}>
        {marker ?? index + 1}
      </Timeline.Marker>
      <Timeline.Heading>{heading}</Timeline.Heading>
      <Timeline.Body>
        <p>{body}</p>
      </Timeline.Body>
    </Timeline.Item>
  ));

const meta = {
  title: 'Organisms/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: objectKeys(timelineVariants.variants.orientation),
    },
    itemAlignment: {
      control: 'select',
      options: objectKeys(timelineVariants.variants.itemAlignment),
    },
    markerStyle: {
      control: 'select',
      options: objectKeys(timelineVariants.variants.markerStyle),
    },
  },
  args: {
    orientation: TIMELINE_ORIENTATION.VERTICAL,
    itemAlignment: CONTENT_ALIGNMENT.LEFT,
    markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const NumberedVertical: TStory = {
  args: {
    children: renderTimelineItems(numberedItems, {
      markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
    }),
  },
};

export const LabelledVertical: TStory = {
  args: {
    markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
    children: renderTimelineItems(labelledItems, {
      markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
    }),
  },
};

export const NumberedHorizontal: TStory = {
  args: {
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    children: renderTimelineItems(fourItems, {
      markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    }),
  },
};

export const LabelledHorizontalCentered: TStory = {
  args: {
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    itemAlignment: CONTENT_ALIGNMENT.CENTER,
    markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
    children: renderTimelineItems(labelledItems, {
      markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      itemAlignment: CONTENT_ALIGNMENT.CENTER,
    }),
  },
};

export const LongTextItem: TStory = {
  args: {
    children: renderTimelineItems(longTextItems, {
      markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
    }),
  },
};
