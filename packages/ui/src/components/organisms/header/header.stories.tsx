import { TextLink } from '@blog/ui/components/atoms/text-link';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
          <TextLink appearance="nav" href="/" isCurrent={true}>
            Home
          </TextLink>
          <TextLink appearance="nav" href="/blog">
            Blog
          </TextLink>
          <TextLink appearance="nav" href="/about">
            About
          </TextLink>
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
              tagline="v1.0.0 · build/local"
            />
          </a>
        </Header.Brand>
        <Header.Nav>
          <TextLink appearance="nav" href="/" isCurrent={true}>
            Home
          </TextLink>
          <TextLink appearance="nav" href="/blog">
            Blog
          </TextLink>
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
          <TextLink appearance="nav" href="/">
            Home
          </TextLink>
        </Header.Nav>
        <Header.Actions>
          <button aria-label="Open menu">☰</button>
          <ThemeToggle isDark={false} onToggle={() => {}} />
        </Header.Actions>
      </>
    ),
  },
};
