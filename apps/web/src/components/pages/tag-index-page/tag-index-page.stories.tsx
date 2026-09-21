import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TagIndexPage } from './tag-index-page';

const meta = {
  title: 'Pages/TagIndexPage',
  component: TagIndexPage,
  tags: ['autodocs'],
  args: {
    locale: 'en',
    tenant: 'tenant-1',
  },
} satisfies Meta<typeof TagIndexPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithHero: TStory = {
  args: {
    tenant: 'tenant-with-hero',
  },
};
