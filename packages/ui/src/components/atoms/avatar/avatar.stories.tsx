import { SIZE } from '@shinefold/config';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { keys } from 'remeda';

import { Avatar } from './avatar';
import { avatarVariants } from './avatar-variants';

const AVATAR_NAME = 'Jane Doe';
const AVATAR_SRC = 'https://i.pravatar.cc/150?img=1';

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    name: AVATAR_NAME,
    alt: AVATAR_NAME,
    size: SIZE.MD,
  },
  argTypes: {
    size: {
      control: 'select',
      options: keys(avatarVariants.variants.size),
    },
    shape: {
      control: 'select',
      options: keys(avatarVariants.variants.shape),
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithImage: TStory = {
  args: { src: AVATAR_SRC },
};

export const Initials: TStory = {};

export const Small: TStory = {
  args: { size: SIZE.SM },
};

export const Large: TStory = {
  args: { size: SIZE.LG },
};

export const SquareWithImage: TStory = {
  args: { shape: 'square', src: AVATAR_SRC },
};

export const SquareInitials: TStory = {
  args: { shape: 'square' },
};

export const Decorative: TStory = {
  name: 'Decorative (beside visible name text)',
  args: { alt: '' },
};
