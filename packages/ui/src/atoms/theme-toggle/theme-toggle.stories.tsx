import type { Meta, StoryObj } from '@storybook/react';

import { ThemeToggle } from './theme-toggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Atoms/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  args: {
    onToggle: () => {},
  },
};
export default meta;

type TStory = StoryObj<typeof ThemeToggle>;

export const Light: TStory = {
  args: { isDark: false },
};

export const Dark: TStory = {
  args: { isDark: true },
};

export const CustomLabels: TStory = {
  args: { isDark: false, darkLabel: 'Dark mode', lightLabel: 'Light mode' },
};

export const Unmounted: TStory = {
  args: { isDark: false, mounted: false },
};
