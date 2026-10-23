import { CONTENT_ALIGNMENT } from '@blog/config';
import { HEADING_LEVELS } from '@blog/ui/lib/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { ModuleHeading } from './module-heading';

const LATEST_POSTS = 'Latest posts';
const WHY_CHOOSE_US = 'Why choose us';
const SUPPORTING_TEXT = 'Fresh from the blog, updated weekly.';

const meta = {
  title: 'Components/ModuleHeading',
  component: ModuleHeading,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: HEADING_LEVELS,
    },
    align: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
    variant: {
      control: 'select',
      options: ['label', 'section'],
    },
  },
  args: {
    headingBlock: mockHeadingBlock({ heading: LATEST_POSTS }),
    id: 'module-heading-story-title',
    level: 2,
    align: undefined,
  },
} satisfies Meta<typeof ModuleHeading>;

export default meta;
type TStory = StoryObj<typeof meta>;

const longHeadingBlock = mockHeadingBlock({
  heading: 'Everything you need to plan, write and ship a great post',
  supportingText:
    'From the first outline to the final proofread, our tools keep your writing workflow moving so you can focus on the ideas instead of the busywork.',
});

export const Default: TStory = {};

export const NoSupportingText: TStory = {
  args: {
    headingBlock: mockHeadingBlock({ heading: LATEST_POSTS }),
  },
};

export const SectionVariantNoSupportingText: TStory = {
  args: {
    variant: 'section',
    headingBlock: mockHeadingBlock({ heading: WHY_CHOOSE_US }),
  },
};

export const WithSupportingText: TStory = {
  args: {
    headingBlock: mockHeadingBlock({
      heading: LATEST_POSTS,
      supportingText: SUPPORTING_TEXT,
    }),
  },
};

export const LeftAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.LEFT,
    headingBlock: longHeadingBlock,
  },
};

export const CenterAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.CENTER,
    headingBlock: longHeadingBlock,
  },
};

export const RightAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.RIGHT,
    headingBlock: longHeadingBlock,
  },
};

export const SectionVariant: TStory = {
  args: {
    variant: 'section',
    headingBlock: mockHeadingBlock({
      heading: WHY_CHOOSE_US,
      supportingText: SUPPORTING_TEXT,
    }),
  },
};
