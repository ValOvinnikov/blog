import type { Meta, StoryObj } from '@storybook/react';

import { ThemeToggle } from './theme-toggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Atoms/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof ThemeToggle>;

export const Default: TStory = {};

export const CustomLabels: TStory = {
  args: { darkLabel: 'Dark mode', lightLabel: 'Light mode' },
};
