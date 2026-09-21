import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TopicIndexPage } from './topic-index-page';

const meta = {
  title: 'Pages/TopicIndexPage',
  component: TopicIndexPage,
  tags: ['autodocs'],
  args: {
    locale: 'en',
    tenant: 'tenant-1',
  },
} satisfies Meta<typeof TopicIndexPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithHero: TStory = {
  args: {
    tenant: 'tenant-with-hero',
  },
};
