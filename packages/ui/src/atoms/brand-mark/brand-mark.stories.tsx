import { Size } from '@blog/config';
import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BrandMark } from './brand-mark';
import { brandMarkVariants } from './brand-mark-variants';

const meta = {
  title: 'Atoms/BrandMark',
  component: BrandMark,
  tags: ['autodocs'],
  args: {
    size: Size.MD,
  },
  argTypes: {
    size: {
      control: 'select',
      options: objectKeys(brandMarkVariants.variants.size),
    },
  },
} satisfies Meta<typeof BrandMark>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Small: TStory = {
  args: { size: Size.SM },
};

export const Large: TStory = {
  args: { size: Size.LG },
};

export const Standalone: TStory = {
  args: { title: 'Brand mark' },
};

export const WithImageSource: TStory = {
  args: { src: 'https://placehold.co/64x64', title: 'Brand mark' },
};

export const WithWideImageSource: TStory = {
  args: { src: 'https://placehold.co/320x64', title: 'Brand mark' },
};

export const StackedWithWideImageSource: TStory = {
  args: {
    src: 'https://placehold.co/320x64',
    title: 'Brand mark',
    stacked: true,
  },
};

// `stacked` sizing only takes effect at `md` and above; below that it must
// render identically to the non-stacked case (see `BrandLockup`'s spec line,
// which reveals at the same breakpoint).
export const StackedWithWideImageSourceNarrowViewport: TStory = {
  globals: { viewport: 'phone' },
  args: {
    src: 'https://placehold.co/320x64',
    title: 'Brand mark',
    stacked: true,
  },
};
