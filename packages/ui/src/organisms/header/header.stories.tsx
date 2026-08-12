import type { Meta, StoryObj } from '@storybook/react-vite';

import { NavLink } from '../../atoms/nav-link';
import { ThemeToggle } from '../../atoms/theme-toggle';
import { BrandLockup } from '../../molecules/brand-lockup';

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
          <NavLink href="/" isActive={true}>
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

export const WithBrandLockup: TStory = {
  args: {
    children: (
      <>
        <Header.Brand>
          <a href="/">
            <BrandLockup
              src="https://placehold.co/64x64"
              specLine="v1.0.0 · build/local"
            />
          </a>
        </Header.Brand>
        <Header.Nav>
          <NavLink href="/" isActive={true}>
            Home
          </NavLink>
          <NavLink href="/blog">Blog</NavLink>
        </Header.Nav>
        <Header.Actions>
          <ThemeToggle isDark={false} onToggle={() => {}} />
        </Header.Actions>
      </>
    ),
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
