import { IMAGE_LAYOUT } from '@blog/config';
import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ImageWithCaption } from './image-with-caption';
import { imageWithCaptionVariants } from './image-with-caption-variants';

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
  argTypes: {
    layout: {
      control: 'select',
      options: objectKeys(imageWithCaptionVariants.variants.layout),
    },
  },
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

export const Inline: TStory = {
  args: { layout: IMAGE_LAYOUT.INLINE },
};

export const FullBleed: TStory = {
  args: { layout: IMAGE_LAYOUT.FULL_BLEED },
};

const wrappedCopy = (
  <p>
    Body text wraps around the floated image at the `md` breakpoint and wider —
    on narrower viewports the image renders full width above the text instead,
    since there isn&apos;t enough room left over for the wrapped copy to stay
    readable. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
    eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
    commodo consequat.
  </p>
);

export const FloatLeft: TStory = {
  args: { layout: IMAGE_LAYOUT.FLOAT_LEFT, className: 'aspect-video w-full' },
  render: (args) => (
    <div>
      <ImageWithCaption {...args} />
      {wrappedCopy}
    </div>
  ),
};

export const FloatRight: TStory = {
  args: { layout: IMAGE_LAYOUT.FLOAT_RIGHT, className: 'aspect-video w-full' },
  render: (args) => (
    <div>
      <ImageWithCaption {...args} />
      {wrappedCopy}
    </div>
  ),
};
