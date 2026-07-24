import type { Meta, StoryObj } from '@storybook/react-vite';

import { Eyebrow } from './eyebrow';

const meta: Meta<typeof Eyebrow> = {
  title: 'Atoms/Eyebrow',
  component: Eyebrow,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Eyebrow>;

export const Default: TStory = {
  args: { children: 'Featured Post' },
};

export const CategoryLabel: TStory = {
  args: { children: 'Engineering' },
};

export const AsCategoryLink: TStory = {
  args: { children: 'Engineering', href: '/category/engineering' },
};
