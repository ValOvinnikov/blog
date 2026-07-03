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
    size: 'md',
  },
};

export const Initials: TStory = {
  args: {
    alt: 'Jane Doe',
    name: 'Jane Doe',
    size: 'md',
  },
};

export const Small: TStory = {
  args: {
    alt: 'Jane Doe',
    name: 'Jane Doe',
    size: 'sm',
  },
};

export const Large: TStory = {
  args: {
    alt: 'Jane Doe',
    name: 'Jane Doe',
    size: 'lg',
  },
};
