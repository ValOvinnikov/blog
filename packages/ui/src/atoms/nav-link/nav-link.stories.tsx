import type { Meta, StoryObj } from '@storybook/react';

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
