import type { Meta, StoryObj } from '@storybook/react';

import { MediaFrame } from './media-frame';

const meta: Meta<typeof MediaFrame> = {
  title: 'Atoms/MediaFrame',
  component: MediaFrame,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof MediaFrame>;

export const Video: TStory = {
  args: {
    className: 'aspect-video',
  },
};

export const Square: TStory = {
  args: {
    className: 'aspect-square w-48',
  },
};

export const Portrait: TStory = {
  args: {
    className: 'aspect-[3/4] w-48',
  },
};
