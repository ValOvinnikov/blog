import type { Meta, StoryObj } from '@storybook/react-vite';

import { BrandLockup } from './brand-lockup';

const meta = {
  title: 'Molecules/BrandLockup',
  component: BrandLockup,
  tags: ['autodocs'],
} satisfies Meta<typeof BrandLockup>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithImageSource: TStory = {
  args: { src: 'https://placehold.co/64x64' },
};

export const WithSpecLine: TStory = {
  args: { specLine: 'v1.0.0 · build/local' },
};

// Narrow-viewport exception (`ui-storybook` skill) — same as `PrimaryNavigation`'s mobile stories.
export const NarrowViewport: TStory = {
  globals: { viewport: 'phone' },
};
