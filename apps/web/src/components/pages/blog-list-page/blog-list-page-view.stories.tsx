import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeBlogListPageView } from '@web/testing/pages/blog-list-page/fixtures';

import { BlogListPageView } from './blog-list-page-view';

const meta = {
  title: 'Pages/BlogListPageView',
  component: BlogListPageView,
  tags: ['autodocs'],
  args: makeBlogListPageView(),
} satisfies Meta<typeof BlogListPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoTopics: TStory = {
  args: {
    topics: [],
  },
};

export const NoSupportingText: TStory = {
  args: {
    supportingText: undefined,
  },
};
