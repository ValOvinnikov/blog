import type { Meta, StoryObj } from '@storybook/react';

import { BrandLockup } from './brand-lockup';

const meta = {
  title: 'Molecules/BrandLockup',
  component: BrandLockup,
  tags: ['autodocs'],
  args: {
    prefix: 'brand',
    suffix: 'io',
  },
} satisfies Meta<typeof BrandLockup>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithSpecLine: TStory = {
  args: { specLine: 'v1.0.0 · build/local' },
};
