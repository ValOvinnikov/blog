import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeTagsPageView } from '@web/testing/pages/tags-page/fixtures';

import { TagsPageView } from './tags-page-view';

const meta = {
  title: 'Pages/TagsPageView',
  component: TagsPageView,
  tags: ['autodocs'],
  args: makeTagsPageView(),
} satisfies Meta<typeof TagsPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoBreadcrumbSchema: TStory = {
  args: {
    breadcrumbListSchema: undefined,
  },
};
