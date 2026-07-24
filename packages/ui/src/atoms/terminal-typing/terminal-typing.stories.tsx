import type { Meta, StoryObj } from '@storybook/react-vite';

import { TerminalTyping } from './terminal-typing';

const meta = {
  title: 'Atoms/TerminalTyping',
  component: TerminalTyping,
  tags: ['autodocs'],
  args: {
    text: 'hello_world',
  },
} satisfies Meta<typeof TerminalTyping>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoCursor: TStory = {
  args: { showCursor: false },
};
