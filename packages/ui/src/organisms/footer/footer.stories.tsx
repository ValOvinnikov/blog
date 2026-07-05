import type { Meta, StoryObj } from '@storybook/react';

import { NavLink } from '../../atoms/nav-link';
import { Footer } from './footer';

const meta: Meta<typeof Footer> = {
  title: 'Organisms/Footer',
  component: Footer,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Footer>;

export const Default: TStory = {
  render: () => (
    <Footer>
      <Footer.Nav>
        <NavLink href="/">Home</NavLink>
        <NavLink href="/about">About</NavLink>
        <NavLink href="/contact">Contact</NavLink>
      </Footer.Nav>
      <Footer.Copyright title="My Blog" />
    </Footer>
  ),
};

export const Minimal: TStory = {
  render: () => (
    <Footer>
      <Footer.Copyright title="My Blog" />
    </Footer>
  ),
};
