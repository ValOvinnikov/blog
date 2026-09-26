import {
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
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
    children: numberedItems.map((item, index) => (
      <Timeline.Item key={item.heading}>
        <Timeline.Marker markerStyle={TIMELINE_MARKER_STYLE.NUMBERED}>
          {index + 1}
        </Timeline.Marker>
        <Timeline.Heading>{item.heading}</Timeline.Heading>
        <Timeline.Body>
          <p>{item.body}</p>
        </Timeline.Body>
      </Timeline.Item>
    )),
  },
};

export const LabelledVertical: TStory = {
  args: {
    markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
    children: labelledItems.map((item) => (
      <Timeline.Item key={item.heading}>
        <Timeline.Marker markerStyle={TIMELINE_MARKER_STYLE.LABELLED}>
          {item.marker}
        </Timeline.Marker>
        <Timeline.Heading>{item.heading}</Timeline.Heading>
        <Timeline.Body>
          <p>{item.body}</p>
        </Timeline.Body>
      </Timeline.Item>
    )),
  },
};

export const NumberedHorizontal: TStory = {
  args: {
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    children: fourItems.map((item, index) => (
      <Timeline.Item
        key={item.heading}
        orientation={TIMELINE_ORIENTATION.HORIZONTAL}
      >
        <Timeline.Marker markerStyle={TIMELINE_MARKER_STYLE.NUMBERED}>
          {index + 1}
        </Timeline.Marker>
        <Timeline.Heading>{item.heading}</Timeline.Heading>
        <Timeline.Body>
          <p>{item.body}</p>
        </Timeline.Body>
      </Timeline.Item>
    )),
  },
};

export const LabelledHorizontalCentered: TStory = {
  args: {
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    itemAlignment: CONTENT_ALIGNMENT.CENTER,
    markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
    children: labelledItems.map((item) => (
      <Timeline.Item
        key={item.heading}
        orientation={TIMELINE_ORIENTATION.HORIZONTAL}
        itemAlignment={CONTENT_ALIGNMENT.CENTER}
      >
        <Timeline.Marker markerStyle={TIMELINE_MARKER_STYLE.LABELLED}>
          {item.marker}
        </Timeline.Marker>
        <Timeline.Heading>{item.heading}</Timeline.Heading>
        <Timeline.Body>
          <p>{item.body}</p>
        </Timeline.Body>
      </Timeline.Item>
    )),
  },
};

export const LongTextItem: TStory = {
  args: {
    children: longTextItems.map((item, index) => (
      <Timeline.Item key={item.heading}>
        <Timeline.Marker markerStyle={TIMELINE_MARKER_STYLE.NUMBERED}>
          {index + 1}
        </Timeline.Marker>
        <Timeline.Heading>{item.heading}</Timeline.Heading>
        <Timeline.Body>
          <p>{item.body}</p>
        </Timeline.Body>
      </Timeline.Item>
    )),
  },
};
