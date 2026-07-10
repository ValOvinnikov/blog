import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { PrimaryNavigation } from './primary-navigation';

const meta = {
  title: 'Molecules/PrimaryNavigation',
  component: PrimaryNavigation,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    links: [
      { href: '/blog', label: 'Blog', isActive: true },
      { href: '/about', label: 'About' },
      { href: '/contact', label: faker.lorem.words(2) },
    ],
  },
} satisfies Meta<typeof PrimaryNavigation>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithActions: TStory = {
  args: {
    actions: <button type="button">Toggle theme</button>,
  },
};

export const WithExternalLink: TStory = {
  args: {
    links: [
      { href: '/blog', label: 'Blog', isActive: true },
      { href: '/about', label: 'About' },
      {
        href: faker.internet.url(),
        label: 'Docs',
        target: '_blank',
      },
    ],
  },
};
