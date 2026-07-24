import { Size } from '@blog/config';
import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from './avatar';
import { avatarVariants } from './avatar-variants';

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    name: 'Jane Doe',
    alt: 'Jane Doe',
    size: Size.MD,
  },
  argTypes: {
    size: {
      control: 'select',
      options: objectKeys(avatarVariants.variants.size),
    },
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
