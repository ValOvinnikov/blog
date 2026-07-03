import { Size } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/react';

import { Avatar } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Avatar>;

export const WithImage: TStory = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'Jane Doe',
    name: 'Jane Doe',
    size: Size.MD,
  },
};

export const Initials: TStory = {
  args: {
    alt: 'Jane Doe',
    name: 'Jane Doe',
    size: Size.MD,
  },
};

export const Small: TStory = {
  args: {
    alt: 'Jane Doe',
    name: 'Jane Doe',
    size: Size.SM,
  },
};

export const Large: TStory = {
  args: {
    alt: 'Jane Doe',
    name: 'Jane Doe',
    size: Size.LG,
  },
};
