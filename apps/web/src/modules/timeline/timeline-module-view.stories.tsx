import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeTimelineItem } from '@web/testing/modules/timeline/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TimelineModuleView } from './timeline-module-view';

const items = [
  makeTimelineItem({ id: 'step-1', heading: 'Discovery', marker: '2021' }),
  makeTimelineItem({ id: 'step-2', heading: 'Design', marker: '2022' }),
  makeTimelineItem({ id: 'step-3', heading: 'Build', marker: '2023' }),
  makeTimelineItem({ id: 'step-4', heading: 'Launch', marker: '2024' }),
];

const meta = {
  title: 'Modules/TimelineModule',
  component: TimelineModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
    itemAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
    markerStyle: {
      control: 'select',
      options: Object.values(TIMELINE_MARKER_STYLE),
    },
    orientation: {
      control: 'select',
      options: Object.values(TIMELINE_ORIENTATION),
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock({ heading: 'How we work' }),
    markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
    items,
    orientation: TIMELINE_ORIENTATION.VERTICAL,
    ctaButtons: [],
    contentAlignment: undefined,
    itemAlignment: CONTENT_ALIGNMENT.LEFT,
    layout: undefined,
    titleId: 'timeline-title',
    dataTestId: 'timeline-module-timeline-1',
  },
} satisfies Meta<typeof TimelineModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Vertical: TStory = {};

export const Horizontal: TStory = {
  args: { orientation: TIMELINE_ORIENTATION.HORIZONTAL },
};

export const Labelled: TStory = {
  args: { markerStyle: TIMELINE_MARKER_STYLE.LABELLED },
};

export const CenterAligned: TStory = {
  args: {
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    itemAlignment: CONTENT_ALIGNMENT.CENTER,
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
  },
};

export const WithActions: TStory = {
  args: { ctaButtons: ctaActionsDemo },
};

export const HorizontalOverCapFallsBackToVertical: TStory = {
  args: {
    orientation: TIMELINE_ORIENTATION.HORIZONTAL,
    items: [
      ...items,
      makeTimelineItem({ id: 'step-5', heading: 'Measure', marker: '2025' }),
      makeTimelineItem({ id: 'step-6', heading: 'Iterate', marker: '2026' }),
    ],
  },
};
