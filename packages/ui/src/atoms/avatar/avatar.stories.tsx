import { Size } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/react';

import { Avatar } from './avatar';

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    name: 'Jane Doe',
    alt: 'Jane Doe',
    size: Size.MD,
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithImage: TStory = {
  args: { src: 'https://i.pravatar.cc/150?img=1' },
};

export const Initials: TStory = {};

export const Small: TStory = {
  args: { size: Size.SM },
};

export const Large: TStory = {
  args: { size: Size.LG },
};
