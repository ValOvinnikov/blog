import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeTagPageView } from '@web/testing/pages/tag-page/fixtures';

import { TagPageView } from './tag-page-view';

const meta = {
  title: 'Pages/TagPageView',
  component: TagPageView,
  tags: ['autodocs'],
  args: makeTagPageView(),
} satisfies Meta<typeof TagPageView>;

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
