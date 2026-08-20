import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { NotFoundPage } from './not-found-page';

const meta = {
  title: 'Pages/NotFoundPage',
  component: NotFoundPage,
  tags: ['autodocs'],
} satisfies Meta<typeof NotFoundPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

/** The `chromeOn: false` tenant treatment — no `TerminalChip`/prompt-line styling. */
export const Plain: TStory = {
  args: { isPlain: true },
};
