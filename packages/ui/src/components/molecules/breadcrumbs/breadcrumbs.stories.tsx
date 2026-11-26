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

const MOCK_HOME_ITEM = { label: 'Home', href: '/' };
const MOCK_TOPIC_HREF = '/topics/engineering';
const MOCK_POST_HREF = '/blog/example-post';

export const Default: TStory = {
  args: {
    items: [
      MOCK_HOME_ITEM,
      { label: faker.commerce.department(), href: MOCK_TOPIC_HREF },
      { label: faker.lorem.sentence(4), href: MOCK_POST_HREF },
    ],
  },
};

export const TwoLevels: TStory = {
  args: {
    items: [
      MOCK_HOME_ITEM,
      { label: faker.commerce.department(), href: '/topics/design' },
    ],
  },
};

export const LongTrail: TStory = {
  args: {
    items: [
      MOCK_HOME_ITEM,
      { label: 'Blog', href: '/blog' },
      { label: faker.commerce.department(), href: '/topics/architecture' },
      { label: faker.lorem.words(3), href: '/tag/systems' },
      { label: faker.lorem.sentence(5), href: '/blog/deep-dive' },
    ],
  },
};

// Truncation follows the container's width, not a viewport breakpoint.
export const Truncated: TStory = {
  args: {
    className: 'max-w-[280px]',
    items: [
      MOCK_HOME_ITEM,
      { label: faker.commerce.department(), href: MOCK_TOPIC_HREF },
      { label: faker.lorem.sentence(8), href: MOCK_POST_HREF },
    ],
  },
};
