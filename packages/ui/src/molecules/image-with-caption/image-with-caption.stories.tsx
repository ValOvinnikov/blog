import type { Meta, StoryObj } from '@storybook/react-vite';

import { ImageWithCaption } from './image-with-caption';

const FillImage = () => (
  <img
    src="https://picsum.photos/seed/mountain/800/450"
    alt="A scenic mountain view"
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
  title: 'Molecules/ImageWithCaption',
  component: ImageWithCaption,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    caption: 'A scenic mountain view',
    className: 'aspect-video w-[480px]',
    children: <FillImage />,
  },
} satisfies Meta<typeof ImageWithCaption>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithCaption: TStory = {};

export const WithoutCaption: TStory = {
  args: { caption: undefined },
};
