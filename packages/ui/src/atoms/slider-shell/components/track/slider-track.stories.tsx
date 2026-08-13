import type { Meta, StoryObj } from '@storybook/react-vite';

import { SliderTrack } from './slider-track';

const meta = {
  title: 'Atoms/SliderShell/Track',
  component: SliderTrack,
  tags: ['autodocs'],
  args: {
    className: 'w-64',
  },
} satisfies Meta<typeof SliderTrack>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Disabled: TStory = {
  render: (args) => <SliderTrack {...args} data-disabled="" />,
};

const hueGradient = `linear-gradient(to right, ${Array.from(
  { length: 13 },
  (_, i) => `oklch(0.53 0.17 ${i * 30})`,
).join(', ')})`;

export const CustomHueGradientBackground: TStory = {
  args: { style: { background: hueGradient } },
};
