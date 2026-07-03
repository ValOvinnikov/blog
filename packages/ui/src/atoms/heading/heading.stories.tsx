import type { Meta, StoryObj } from '@storybook/react';

import { Heading } from './heading';

const meta: Meta<typeof Heading> = {
  title: 'Atoms/Heading',
  component: Heading,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Heading>;

export const H1: TStory = {
  args: { level: 1, children: 'Heading Level 1' },
};

export const H2: TStory = {
  args: { level: 2, children: 'Heading Level 2' },
};

export const H3: TStory = {
  args: { level: 3, children: 'Heading Level 3' },
};

export const H4: TStory = {
  args: { level: 4, children: 'Heading Level 4' },
};

export const WithSizeOverride: TStory = {
  args: { level: 2, size: 'xs', children: 'H2 with xs size override' },
};
