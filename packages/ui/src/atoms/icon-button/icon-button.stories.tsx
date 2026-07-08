import type { Meta, StoryObj } from '@storybook/react';
import { Moon, Sun } from 'lucide-react';

import { IconButton } from './icon-button';

const meta = {
  title: 'Atoms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    ariaLabel: 'Action',
    children: <Sun size={16} strokeWidth={1.6} aria-hidden="true" />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithMoonIcon: TStory = {
  args: {
    ariaLabel: 'Switch to dark theme',
    children: <Moon size={16} strokeWidth={1.6} aria-hidden="true" />,
  },
};
