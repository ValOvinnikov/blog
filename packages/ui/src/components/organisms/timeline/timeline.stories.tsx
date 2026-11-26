import { faker } from '@faker-js/faker';
import {
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
  type TContentAlignment,
  type TTimelineMarkerStyle,
  type TTimelineOrientation,
} from '@shinefold/config';
import { SHINEFOLD_PRESET_STORY } from '@shinefold/ui/testing/shinefold-preset';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { keys } from 'remeda';

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

const rangeLabelledItems = [
  {
    marker: '2016',
    heading: faker.company.catchPhrase(),
    body: faker.lorem.sentence(),
  },
  {
    marker: '2019 – 2021',
    heading: faker.company.catchPhrase(),
    body: faker.lorem.sentence(),
  },
  {
    marker: 'Q3 2024',
    heading: faker.company.catchPhrase(),
    body: faker.lorem.sentence(),
  },
];

const fourItems = Array.from({ length: 4 }, () => ({
  heading: faker.company.catchPhrase(),
  body: faker.lorem.sentence(),
}));

const fiveItems = Array.from({ length: 5 }, () => ({
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

const inSidebarColumn: Decorator = (Story) => (
  <div className="max-w-[37.5rem] outline outline-dashed outline-divider">
    <Story />
  </div>
);

const meta = {
  title: 'Organisms/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    orientation: {
      control: 'select',
      options: keys(timelineVariants.variants.orientation),
    },
    itemAlignment: {
      control: 'select',
      options: keys(timelineVariants.variants.itemAlignment),
    },
    markerStyle: {
      control: 'select',
      options: keys(timelineVariants.variants.markerStyle),
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

export const LabelledVerticalLongMarker: TStory = {
  args: {
    markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
    children: renderTimelineItems(rangeLabelledItems, {
      markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
    }),
  },
};

export const LabelledHorizontalLongMarker: TStory = {
  args: {
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
    children: renderTimelineItems(rangeLabelledItems, {
      markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    }),
  },
};

export const NumberedVerticalCentered: TStory = {
  args: {
    itemAlignment: CONTENT_ALIGNMENT.CENTER,
    children: renderTimelineItems(numberedItems, {
      markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
      itemAlignment: CONTENT_ALIGNMENT.CENTER,
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

export const NumberedHorizontalCentered: TStory = {
  args: {
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    itemAlignment: CONTENT_ALIGNMENT.CENTER,
    children: renderTimelineItems(fourItems, {
      markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      itemAlignment: CONTENT_ALIGNMENT.CENTER,
    }),
  },
};

export const NumberedHorizontalInSidebarColumn: TStory = {
  ...NumberedHorizontal,
  decorators: [inSidebarColumn],
};

export const NumberedHorizontalCenteredInSidebarColumn: TStory = {
  ...NumberedHorizontalCentered,
  decorators: [inSidebarColumn],
};

export const FiveStepsHorizontalInSidebarColumn: TStory = {
  args: {
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    itemAlignment: CONTENT_ALIGNMENT.CENTER,
    children: renderTimelineItems(fiveItems, {
      markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      itemAlignment: CONTENT_ALIGNMENT.CENTER,
    }),
  },
  decorators: [inSidebarColumn],
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

export const NumberedVerticalShinefoldPreset: TStory = {
  ...NumberedVertical,
  ...SHINEFOLD_PRESET_STORY,
};
