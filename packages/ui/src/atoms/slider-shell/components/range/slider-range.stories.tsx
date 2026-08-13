import type { Meta, StoryObj } from '@storybook/react-vite';

import { SliderRange } from './slider-range';

const meta = {
  title: 'Atoms/SliderShell/Range',
  component: SliderRange,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative h-2 w-64 rounded-full bg-secondary">
        <Story />
      </div>
    ),
  ],
  args: {
    style: { width: '60%' },
  },
} satisfies Meta<typeof SliderRange>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
