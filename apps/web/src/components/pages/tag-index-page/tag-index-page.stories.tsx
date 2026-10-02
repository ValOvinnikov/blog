import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TagIndexPage } from './tag-index-page';

const meta = {
  title: 'Pages/TagIndexPage',
  component: TagIndexPage,
  tags: ['autodocs'],
} satisfies Meta<typeof TagIndexPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
