import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { LocaleErrorPage } from './locale-error-page';

const meta = {
  title: 'Pages/LocaleErrorPage',
  component: LocaleErrorPage,
  tags: ['autodocs'],
  args: {
    error: new Error('Failed to render the post page'),
    reset: fn(),
  },
} satisfies Meta<typeof LocaleErrorPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
