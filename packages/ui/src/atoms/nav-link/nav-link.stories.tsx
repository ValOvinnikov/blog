import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NavLink } from './nav-link';

const meta: Meta<typeof NavLink> = {
  title: 'Atoms/NavLink',
  component: NavLink,
  tags: ['autodocs'],
  args: { href: '#', children: 'Link' },
  argTypes: {
    isActive: {
      control: 'boolean',
    },
  },
};
export default meta;

type TStory = StoryObj<typeof NavLink>;

export const Default: TStory = {};

export const Active: TStory = {
  args: { isActive: true, children: 'Active link' },
};

export const Inactive: TStory = {
  args: { isActive: false, children: 'Inactive link' },
};

export const WithIcon: TStory = {
  args: {
    children: 'RSS feed',
    icon: <Icon name={ICONS.RSS} size={SIZE.SM} />,
  },
};

export const IconOnly: TStory = {
  args: {
    children: 'RSS feed',
    icon: <Icon name={ICONS.RSS} size={SIZE.SM} />,
    hasLabel: false,
  },
};
