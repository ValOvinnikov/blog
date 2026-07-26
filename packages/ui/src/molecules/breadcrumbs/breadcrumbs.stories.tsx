import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumbs } from './breadcrumbs';

const meta = {
  title: 'Molecules/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    ariaLabel: 'Breadcrumb',
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: faker.commerce.department(), href: '/category/engineering' },
      { label: faker.lorem.sentence(4), href: '/blog/example-post' },
    ],
  },
};

export const TwoLevels: TStory = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: faker.commerce.department(), href: '/category/design' },
    ],
  },
};

export const LongTrail: TStory = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: faker.commerce.department(), href: '/category/architecture' },
      { label: faker.lorem.words(3), href: '/tag/systems' },
      { label: faker.lorem.sentence(5), href: '/blog/deep-dive' },
    ],
  },
};
