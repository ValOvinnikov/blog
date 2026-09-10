import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TagsPage } from './tags-page';

const meta = {
  title: 'Pages/TagsPage',
  component: TagsPage,
  tags: ['autodocs'],
  args: {
    locale: 'en',
    tenant: 'tenant-1',
  },
} satisfies Meta<typeof TagsPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithHero: TStory = {
  args: {
    tenant: 'tenant-with-hero',
  },
};
