import type { Meta, StoryObj } from '@storybook/react';

import { Tag } from './tag';

const meta: Meta<typeof Tag> = {
  title: 'Atoms/Tag',
  component: Tag,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Tag>;

export const Default: TStory = {
  args: { children: 'react', variant: 'default' },
};

export const Accent: TStory = {
  args: { children: 'architecture', variant: 'accent' },
};
