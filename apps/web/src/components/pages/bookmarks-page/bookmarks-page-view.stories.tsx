import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeBookmarksPageView } from '@web/testing/pages/bookmarks-page/fixtures';

import { BookmarksPageView } from './bookmarks-page-view';

const meta = {
  title: 'Pages/BookmarksPageView',
  component: BookmarksPageView,
  tags: ['autodocs'],
  args: makeBookmarksPageView(),
} satisfies Meta<typeof BookmarksPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Empty: TStory = {
  args: {
    posts: [],
    hint: undefined,
  },
};
