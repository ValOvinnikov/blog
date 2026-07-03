import type { Meta, StoryObj } from '@storybook/react';

import { Footer } from './footer';

const meta: Meta<typeof Footer> = {
  title: 'Organisms/Footer',
  component: Footer,
  tags: ['autodocs'],
  args: {
    title: 'My Blog',
  },
};
export default meta;

type TStory = StoryObj<typeof Footer>;

export const Default: TStory = {
  args: {
    navLinks: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
  },
};

export const Minimal: TStory = {};
