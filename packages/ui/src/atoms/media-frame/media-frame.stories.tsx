import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react';

import { MediaFrame } from './media-frame';
import { mediaFrameVariants } from './media-frame-variants';

const FillImage = () => (
  <img
    src="https://picsum.photos/seed/media/800/600"
    alt="placeholder"
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    }}
  />
);

const meta = {
  title: 'Atoms/MediaFrame',
  component: MediaFrame,
  tags: ['autodocs'],
  args: {
    ratio: 'video',
    className: 'w-96',
    children: <FillImage />,
  },
  argTypes: {
    ratio: {
      control: 'select',
      options: objectKeys(mediaFrameVariants.variants.ratio),
    },
  },
} satisfies Meta<typeof MediaFrame>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Video: TStory = {};

export const Square: TStory = {
  args: { ratio: 'square', className: 'w-48' },
};

export const Portrait: TStory = {
  args: { ratio: 'portrait', className: 'w-48' },
};

export const CustomRatio: TStory = {
  args: { ratio: undefined, className: 'aspect-[16/9] w-96' },
};
