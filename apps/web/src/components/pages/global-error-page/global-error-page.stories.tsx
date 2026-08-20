import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { GlobalErrorPage } from './global-error-page';

const meta = {
  title: 'Pages/GlobalErrorPage',
  component: GlobalErrorPage,
  tags: ['autodocs'],
  args: {
    error: new Error('Failed to render the root layout'),
    reset: fn(),
  },
} satisfies Meta<typeof GlobalErrorPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
