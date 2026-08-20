import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { ErrorPage } from './error-page';

const meta = {
  title: 'Pages/ErrorPage',
  component: ErrorPage,
  tags: ['autodocs'],
  args: {
    error: new Error('Failed to render the root layout'),
    reset: fn(),
  },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

/**
 * A `digest` is present when Next.js redacts a Server Component error's
 * message in production — this story only pins that the boundary still
 * renders identically, since the copy itself never surfaces the digest.
 */
export const WithDigest: TStory = {
  args: {
    error: Object.assign(new Error('Failed to render the root layout'), {
      digest: 'abc123',
    }),
  },
};
