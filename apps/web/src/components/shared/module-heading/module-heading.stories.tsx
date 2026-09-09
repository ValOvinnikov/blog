import { CONTENT_ALIGNMENT } from '@blog/config';
import { HEADING_LEVELS } from '@blog/ui/lib/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { ModuleHeading } from './module-heading';

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
  },
  args: {
    headingBlock: makeHeadingBlock({ heading: 'Latest posts' }),
    accessibleTitle: 'Posts',
    id: 'module-heading-story-title',
    level: 2,
    align: undefined,
  },
} satisfies Meta<typeof ModuleHeading>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithSupportingText: TStory = {
  args: {
    headingBlock: makeHeadingBlock({
      heading: 'Latest posts',
      supportingText: 'Fresh from the blog, updated weekly.',
    }),
  },
};

export const BlankHeadingFallback: TStory = {
  args: { headingBlock: makeHeadingBlock() },
};

export const CenterAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.CENTER,
    headingBlock: makeHeadingBlock({
      heading: 'Latest posts',
      supportingText: 'Fresh from the blog, updated weekly.',
    }),
  },
};

export const RightAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.RIGHT,
    headingBlock: makeHeadingBlock({
      heading: 'Latest posts',
      supportingText: 'Fresh from the blog, updated weekly.',
    }),
  },
};
