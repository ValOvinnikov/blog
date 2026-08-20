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

// The first trail item always renders a decorative House icon in place of
// its visible label — the label stays as visually-hidden text, so its
// `label` value (e.g. "Home") only affects the accessible name, not what's
// shown on screen.
export const Default: TStory = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: faker.commerce.department(), href: '/topics/engineering' },
      { label: faker.lorem.sentence(4), href: '/blog/example-post' },
    ],
  },
};

export const TwoLevels: TStory = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: faker.commerce.department(), href: '/topics/design' },
    ],
  },
};

export const LongTrail: TStory = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: faker.commerce.department(), href: '/topics/architecture' },
      { label: faker.lorem.words(3), href: '/tag/systems' },
      { label: faker.lorem.sentence(5), href: '/blog/deep-dive' },
    ],
  },
};

// Truncation is driven by available width, not a viewport breakpoint — a
// constrained container reproduces it at any canvas size, so this pins a
// `className` width instead of the `ui-storybook` narrow-viewport exception
// (that exception is reserved for real `md:`/`sm:`-style behavior forks).
// The trail stays on one line; only the last segment truncates with an
// ellipsis, while the House icon and earlier segments stay fully visible.
export const Truncated: TStory = {
  args: {
    className: 'max-w-[280px]',
    items: [
      { label: 'Home', href: '/' },
      { label: faker.commerce.department(), href: '/topics/engineering' },
      { label: faker.lorem.sentence(8), href: '/blog/example-post' },
    ],
  },
};
