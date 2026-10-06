import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockPostHeadings } from '@web/testing/shared/post-table-of-contents/fixtures';

import { PostTableOfContents } from './post-table-of-contents';

const meta = {
  title: 'Features/Post/PostTableOfContents',
  component: PostTableOfContents,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { headings: mockPostHeadings },
} satisfies Meta<typeof PostTableOfContents>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Desktop: TStory = {};

export const Mobile: TStory = {
  globals: { viewport: 'mobile' },
};
