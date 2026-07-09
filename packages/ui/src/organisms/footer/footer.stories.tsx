import type { Meta, StoryObj } from '@storybook/react';

import { NavLink } from '../../atoms/nav-link';

import { Footer } from './footer';

const meta = {
  title: 'Organisms/Footer',
  component: Footer,
  tags: ['autodocs'],
  args: {
    children: (
      <>
        <Footer.Nav>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </Footer.Nav>
        <Footer.Copyright title="My Blog" />
      </>
    ),
  },
} satisfies Meta<typeof Footer>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Minimal: TStory = {
  args: {
    children: <Footer.Copyright title="My Blog" />,
  },
};
