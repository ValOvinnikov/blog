import { SIZE } from '@blog/config';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BrandMark } from './brand-mark';
import { brandMarkVariants } from './brand-mark-variants';

const MOCK_TITLE = 'Brand mark';
const MOCK_WIDE_SRC = 'https://placehold.co/320x64';

const meta = {
  title: 'Atoms/BrandMark',
  component: BrandMark,
  tags: ['autodocs'],
  args: {
    size: SIZE.MD,
    siteName: 'Northern Notes',
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

export const Dark: TStory = {
  globals: { theme: 'dark' },
};

export const NameStartingWithDigit: TStory = {
  args: { siteName: '42 Field Notes' },
};

export const EmptyName: TStory = {
  args: { siteName: '' },
};

export const Small: TStory = {
  args: { size: SIZE.SM },
};

export const Large: TStory = {
  args: { size: SIZE.LG },
};

export const Standalone: TStory = {
  args: { title: MOCK_TITLE },
};

export const WithImageSource: TStory = {
  args: { src: 'https://placehold.co/64x64', title: MOCK_TITLE },
};

export const WithWideImageSource: TStory = {
  args: { src: MOCK_WIDE_SRC, title: MOCK_TITLE },
};

export const StackedWithWideImageSource: TStory = {
  args: {
    src: MOCK_WIDE_SRC,
    title: MOCK_TITLE,
    isStacked: true,
  },
};

// `isStacked` sizing only takes effect at `md` and above; below that it must
// render identically to the non-stacked case (see `BrandLockup`'s tagline,
// which reveals at the same breakpoint).
export const StackedWithWideImageSourceNarrowViewport: TStory = {
  globals: { viewport: 'phone' },
  args: {
    src: MOCK_WIDE_SRC,
    title: MOCK_TITLE,
    isStacked: true,
  },
};
