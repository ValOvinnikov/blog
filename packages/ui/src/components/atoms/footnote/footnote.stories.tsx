import type { Meta, StoryObj } from '@storybook/react-vite';

import { Footnote } from './footnote';

const meta: Meta<typeof Footnote> = {
  title: 'Atoms/Footnote',
  component: Footnote,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Footnote>;

export const Default: TStory = {
  args: { children: 'No card required · cancel anytime' },
};
