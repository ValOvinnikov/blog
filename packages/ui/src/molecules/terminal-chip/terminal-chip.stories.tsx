import type { Meta, StoryObj } from '@storybook/react-vite';

import { TerminalChip } from './terminal-chip';

const meta = {
  title: 'Molecules/TerminalChip',
  component: TerminalChip,
  tags: ['autodocs'],
  args: {
    prefix: 'brand',
    suffix: 'io',
  },
} satisfies Meta<typeof TerminalChip>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoCursor: TStory = {
  args: { showCursor: false },
};
