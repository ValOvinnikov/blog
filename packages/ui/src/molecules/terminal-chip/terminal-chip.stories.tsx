import type { Meta, StoryObj } from '@storybook/react';

import { TerminalChip } from './terminal-chip';

const meta = {
  title: 'Molecules/TerminalChip',
  component: TerminalChip,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['console', 'indigo'],
    },
  },
} satisfies Meta<typeof TerminalChip>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Indigo: TStory = {
  args: { variant: 'indigo' },
};

export const NoCursor: TStory = {
  args: { showCursor: false },
};
