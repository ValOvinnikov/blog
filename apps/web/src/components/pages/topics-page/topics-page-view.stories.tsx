import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeTopicsPageView } from '@web/testing/pages/topics-page/fixtures';

import { TopicsPageView } from './topics-page-view';

const meta = {
  title: 'Pages/TopicsPageView',
  component: TopicsPageView,
  tags: ['autodocs'],
  args: makeTopicsPageView(),
} satisfies Meta<typeof TopicsPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoBreadcrumbSchema: TStory = {
  args: {
    breadcrumbListSchema: undefined,
  },
};
