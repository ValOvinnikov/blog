import type { Meta, StoryObj } from '@storybook/react-vite';

import { SliderThumb } from './slider-thumb';

const meta = {
  title: 'Atoms/SliderShell/Thumb',
  component: SliderThumb,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative h-2 w-64 rounded-full bg-secondary">
        <Story />
      </div>
    ),
  ],
  args: {
    style: { left: '50%' },
  },
} satisfies Meta<typeof SliderThumb>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Dragging: TStory = {
  render: (args) => <SliderThumb {...args} data-dragging="" />,
};

export const Disabled: TStory = {
  render: (args) => (
    <SliderThumb {...args} data-disabled="" aria-disabled="true" />
  ),
};

export const Focused: TStory = {
  args: { tabIndex: 0, autoFocus: true },
};
