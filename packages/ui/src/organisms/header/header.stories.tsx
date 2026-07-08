import type { Meta, StoryObj } from '@storybook/react';

import { NavLink } from '../../atoms/nav-link';
import { ThemeToggle } from '../../atoms/theme-toggle';
import { Header } from './header';

const meta = {
  title: 'Organisms/Header',
  component: Header,
  tags: ['autodocs'],
  args: {
    children: (
      <>
        <Header.Brand>My Blog</Header.Brand>
        <Header.Nav>
          <NavLink href="/" isActive>
            Home
          </NavLink>
          <NavLink href="/blog">Blog</NavLink>
          <NavLink href="/about">About</NavLink>
        </Header.Nav>
        <Header.Actions>
          <ThemeToggle isDark={false} onToggle={() => {}} />
        </Header.Actions>
      </>
    ),
  },
} satisfies Meta<typeof Header>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const BrandOnly: TStory = {
  args: {
    children: <Header.Brand>My Blog</Header.Brand>,
  },
};

export const WithMobileTrigger: TStory = {
  args: {
    children: (
      <>
        <Header.Brand>My Blog</Header.Brand>
        <Header.Nav>
          <NavLink href="/">Home</NavLink>
        </Header.Nav>
        <Header.Actions>
          <button aria-label="Open menu">☰</button>
          <ThemeToggle isDark={false} onToggle={() => {}} />
        </Header.Actions>
      </>
    ),
  },
};
