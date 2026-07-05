import type { Meta, StoryObj } from '@storybook/react';

import { NavLink } from '../../atoms/nav-link';
import { ThemeToggle } from '../../atoms/theme-toggle';
import { Header } from './header';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Header>;

export const Default: TStory = {
  render: () => (
    <Header>
      <Header.Brand>My Blog</Header.Brand>
      <Header.Nav>
        <NavLink href="/" isActive>
          Home
        </NavLink>
        <NavLink href="/blog">Blog</NavLink>
        <NavLink href="/about">About</NavLink>
      </Header.Nav>
      <Header.Actions>
        <ThemeToggle />
      </Header.Actions>
    </Header>
  ),
};

export const BrandOnly: TStory = {
  render: () => (
    <Header>
      <Header.Brand>My Blog</Header.Brand>
    </Header>
  ),
};

export const WithMobileTrigger: TStory = {
  render: () => (
    <Header>
      <Header.Brand>My Blog</Header.Brand>
      <Header.Nav>
        <NavLink href="/">Home</NavLink>
      </Header.Nav>
      <Header.Actions>
        <button aria-label="Open menu">☰</button>
        <ThemeToggle />
      </Header.Actions>
    </Header>
  ),
};
