import type { Meta, StoryObj } from '@storybook/react';

import { Header } from './header';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  tags: ['autodocs'],
  args: {
    title: 'My Blog',
    navLinks: [
      { href: '/', label: 'Home' },
      { href: '/blog', label: 'Blog' },
      { href: '/about', label: 'About' },
    ],
  },
};
export default meta;

type TStory = StoryObj<typeof Header>;

export const Default: TStory = {};

export const WithActiveLink: TStory = {
  args: {
    navLinks: [
      { href: '/', label: 'Home' },
      { href: '/blog', label: 'Blog', isActive: true },
      { href: '/about', label: 'About' },
    ],
  },
};

export const BrandOnly: TStory = {
  args: {
    navLinks: [],
  },
};
