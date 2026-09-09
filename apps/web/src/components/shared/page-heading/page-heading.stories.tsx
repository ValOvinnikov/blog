import { CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PageHeading } from './page-heading';

const meta = {
  title: 'Components/PageHeading',
  component: PageHeading,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
  },
  args: {
    heading: 'Notes on building things',
    supportingText: undefined,
    align: undefined,
  },
} satisfies Meta<typeof PageHeading>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithSupportingText: TStory = {
  args: {
    supportingText: 'Essays and notes from the team, published as we ship.',
  },
};

export const CenterAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.CENTER,
    supportingText: 'Essays and notes from the team, published as we ship.',
  },
};

export const RightAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.RIGHT,
    supportingText: 'Essays and notes from the team, published as we ship.',
  },
};
