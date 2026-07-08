import type { Meta, StoryObj } from '@storybook/react';

import { MediaFrame } from './media-frame';

const meta = {
  title: 'Atoms/MediaFrame',
  component: MediaFrame,
  tags: ['autodocs'],
} satisfies Meta<typeof MediaFrame>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** Simulates a Next.js `<Image fill />` child using a plain img tag. */
const FillImage = ({ seed = 'media' }: { seed?: string }) => (
  <img
    src={`https://picsum.photos/seed/${seed}/800/600`}
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

export const Video: TStory = {
  render: () => (
    <MediaFrame ratio="video" className="w-96">
      <FillImage seed="video" />
    </MediaFrame>
  ),
};

export const Square: TStory = {
  render: () => (
    <MediaFrame ratio="square" className="w-48">
      <FillImage seed="square" />
    </MediaFrame>
  ),
};

export const Portrait: TStory = {
  render: () => (
    <MediaFrame ratio="portrait" className="w-48">
      <FillImage seed="portrait" />
    </MediaFrame>
  ),
};

export const CustomRatio: TStory = {
  render: () => (
    <MediaFrame className="aspect-[16/9] w-96">
      <FillImage seed="custom" />
    </MediaFrame>
  ),
};
