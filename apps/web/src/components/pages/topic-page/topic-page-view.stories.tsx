import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeTopicPageView } from '@web/testing/pages/topic-page/fixtures';

import { TopicPageView } from './topic-page-view';

const meta = {
  title: 'Pages/TopicPageView',
  component: TopicPageView,
  tags: ['autodocs'],
  args: makeTopicPageView(),
} satisfies Meta<typeof TopicPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoSupportingText: TStory = {
  args: {
    supportingText: undefined,
  },
};

export const NoBreadcrumbSchema: TStory = {
  args: {
    breadcrumbListSchema: undefined,
  },
};
