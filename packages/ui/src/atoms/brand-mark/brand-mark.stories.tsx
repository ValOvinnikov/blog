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
