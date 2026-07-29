import { ICONS } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconButton } from './icon-button';

const meta = {
  title: 'Atoms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    ariaLabel: 'Action',
    children: (
      <Icon name={ICONS.SUN} size={16} strokeWidth={1.6} aria-hidden="true" />
    ),
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithMoonIcon: TStory = {
  args: {
    ariaLabel: 'Switch to dark theme',
    children: (
      <Icon name={ICONS.MOON} size={16} strokeWidth={1.6} aria-hidden="true" />
    ),
  },
};
