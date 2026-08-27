import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeGenericPageView } from '@web/testing/pages/generic-page/fixtures';

import { GenericPageView } from './generic-page-view';

const meta = {
  title: 'Pages/GenericPageView',
  component: GenericPageView,
  tags: ['autodocs'],
  args: makeGenericPageView(),
} satisfies Meta<typeof GenericPageView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoBreadcrumbSchema: TStory = {
  args: {
    breadcrumbListSchema: undefined,
  },
};
